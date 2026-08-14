const WebSocket = require("ws");

const PORT = 8080;

const players = new Map();

const wss = new WebSocket.Server({
    port: PORT
});

console.log(`[Tracer] Server started on port ${PORT}`);


wss.on("connection", (socket) => {

    let playerUuid = null;

    console.log("[Tracer] Client connected");

    socket.on("message", (raw) => {

        try {

            const data = JSON.parse(
                raw.toString()
            );

            switch (data.type) {

                case "hello":
                    playerUuid = data.uuid;

                    players.set(data.uuid, {
                        uuid: data.uuid,
                        name: data.name,
                        socket: socket,

                        x: 0,
                        y: 0,
                        z: 0,

                        dimension: null,
                        lastUpdate: Date.now()
                    });

                    console.log(
                        `[Tracer] ${data.name} connected`
                    );

                    break;


                case "position":

                    if (!playerUuid) {
                        return;
                    }

                    const player =
                        players.get(playerUuid);

                    if (!player) {
                        return;
                    }

                    player.x = data.x;
                    player.y = data.y;
                    player.z = data.z;

                    player.dimension =
                        data.dimension;

                    player.lastUpdate =
                        Date.now();

                    broadcastPosition(player);

                    break;
            }

        } catch (error) {

            console.error(
                "[Tracer] Invalid packet:",
                error
            );
        }
    });


    socket.on("close", () => {

        if (!playerUuid) {
            return;
        }

        const player =
            players.get(playerUuid);

        players.delete(playerUuid);

        if (player) {

            broadcast({
                type: "player_remove",
                uuid: player.uuid
            });

            console.log(
                `[Tracer] ${player.name} disconnected`
            );
        }
    });
});


function broadcastPosition(player) {

    broadcast({
        type: "player_position",

        uuid: player.uuid,
        name: player.name,

        x: player.x,
        y: player.y,
        z: player.z,

        dimension: player.dimension,

        timestamp: player.lastUpdate
    });
}


function broadcast(data) {

    const message =
        JSON.stringify(data);

    for (const player of players.values()) {

        if (
            player.socket.readyState ===
            WebSocket.OPEN
        ) {

            player.socket.send(message);
        }
    }
}