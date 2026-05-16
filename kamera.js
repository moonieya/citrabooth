const video = document.getElementById("video");
const countdown = document.getElementById("countdown");
const next = document.getElementById("next");
const upload = document.getElementById("upload");
const infoUpload = document.getElementById("infoUpload");

//layout
const params = new URLSearchParams(window.location.search);
const layout = params.get("layout");

let jumlahFoto = 1;
if (layout === "B") jumlahFoto = 2;
if (layout === "C") jumlahFoto = 4;


if (jumlahFoto > 1) {
    upload.setAttribute("multiple", true);
}

let hasilFoto = [];

//kamera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(() => alert("Tidak bisa akses kamera"));

function mulaiFoto() {
    hasilFoto = [];
    next.disabled = true;
    next.classList.remove("active");
    ambilLoop(0);
}

function ambilLoop(i) {
    if (i >= jumlahFoto) {
        cek();
        return;
    }

    let c = 3;
    countdown.innerText = c;

    let t = setInterval(() => {
        c--;
        countdown.innerText = c;

        if (c === 0) {
            clearInterval(t);
            ambilFoto();
            setTimeout(() => ambilLoop(i + 1), 500);
        }
    }, 1000);
}

function ambilFoto() {
    const canvas = document.createElement("canvas");

    const scale = 0.4;
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const img = canvas.toDataURL("image/jpeg", 0.6);

    hasilFoto.push(img);

    const el = document.createElement("img");
    el.src = img;

    cek();
}

//upload
upload.addEventListener("change", function () {

    const files = Array.from(this.files);

    if (files.length !== jumlahFoto) {
        alert("Harus pilih " + jumlahFoto + " foto!");
        this.value = "";
        return;
    }


    files.forEach(file => {

        const reader = new FileReader();

        reader.onload = function (e) {

            const img = new Image();

            img.onload = function () {

                const canvas = document.createElement("canvas");
                const scale = 0.4;

                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const result = canvas.toDataURL("image/jpeg", 0.6);

                hasilFoto.push(result);

                const el = document.createElement("img");
                el.src = result;

                cek();
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });

});

//cek
function cek() {
    if (hasilFoto.length === jumlahFoto) {
        next.disabled = false;
        next.classList.add("active");

        setTimeout(() => {
            kirimKeHasil();
        }, 500); // delay biar smooth (opsional)
    }
}

//mengirim ke hasil
function kirimKeHasil() {

    if (hasilFoto.length !== jumlahFoto) {
        alert("Foto belum lengkap!");
        return;
    }

    try {
        localStorage.setItem("foto", JSON.stringify(hasilFoto));
    } catch (e) {
        alert("Gagal simpan! Foto terlalu besar");
        console.error(e);
        return;
    }

    window.location.href = "hasil.html";
}

//ulang
function ulang() {
    hasilFoto = [];
    countdown.innerText = "";
    next.disabled = true;
    next.classList.remove("active");
}