const socket = new WebSocket("ws://localhost:9009/ws");

socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
});

let localMedia = IonSDK.LocalStream.getUserMedia({
    resolution: "hd",
    codec: "h264",
    audio: true,
});

const videos = [
    document.getElementById("1"),
    document.getElementById("2"),
    document.getElementById("3"),
    document.getElementById("4"),
    document.getElementById("5")
];

let signal = new Signal.IonSFUJSONRPCSignal(
    "ws://localhost:7000/ws"
);

const streams = {};

let client = new IonSDK.Client(signal);

signal.onopen = () => {
    console.log("Connected to Ion server, joining session");
    client.join("fivestream");
    client
    client.publish();
}
client.ontrack = (track, stream) => {
    console.log("Received new track ", track);
    if (track.kind === "video") {
        if (!streams[stream.id]) {
            videos[0].srcObject = stream;
            videos[0].autoplay = true;
            videos[0].muted = true;

            stream.onremovetrack = () => {
                videos[0].srcObject = null;
                streams[stream.id] = null;
            };

            streams[stream.id] = stream;
        }
    }
};
