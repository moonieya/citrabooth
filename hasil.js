const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const SCALE = 2;
const IMG_W = 300;
const IMG_H = 280;
const GAP = 20;
const BOTTOM = 100;

let realWidth, realHeight;

let fotoList = JSON.parse(localStorage.getItem("foto")) || [];

if (fotoList.length === 0) {
    alert("Foto tidak ditemukan!");
    window.location.href = "kamera.html";
}

let images = [];
let loaded = 0;

fotoList.forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
        images[i] = img;
        loaded++;
        if (loaded === fotoList.length) {
            setupCanvas();
            render();
        }
    };
    img.src = src;
});

//canvas
function setupCanvas() {
    let width, height;

    if (images.length === 4) {
        width  = (IMG_W * 2) + (GAP * 3);
        height = (IMG_H * 2) + (GAP * 3) + BOTTOM;
    } else {
        width  = IMG_W + (GAP * 2);
        height = (IMG_H * images.length) + (GAP * (images.length + 1)) + BOTTOM;
    }

    realWidth  = width;
    realHeight = height;

    canvas.width  = width  * SCALE;
    canvas.height = height * SCALE;

    canvas.style.width  = width  + "px";
    canvas.style.height = height + "px";

    ctx.scale(SCALE, SCALE);
}

document.querySelectorAll("input").forEach(el => {
    el.addEventListener("input", () => {
        updateLabel();
        render();
    });
});


//label
function updateLabel() {
    valBrightness.innerText  = brightness.value  + "%";
    valContrast.innerText    = contrast.value    + "%";
    valSaturation.innerText  = saturation.value  + "%";
    valTemperature.innerText = temperature.value + "%";
    valExposure.innerText    = exposure.value    + "%";
    valGray.innerText        = grayscale.value   + "%";
    valBiner.innerText       = biner.value;
    valTx.innerText          = tx.value      + "%";
    valTy.innerText          = ty.value      + "%";
    valRotate.innerText      = rotate.value  + "°";
    valScale.innerText       = scale.value   + "%";
}

//fungsi
function clampScale(sc) {
    let maxScaleX = realWidth  / IMG_W;
    let maxScaleY = realHeight / IMG_H;
    return Math.min(sc, maxScaleX, maxScaleY);
}

//fungsi render
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, realWidth, realHeight);

    let totalWidth = (images.length === 4) ? (IMG_W * 2 + GAP) : IMG_W;
    let startX = (realWidth - totalWidth) / 2;

    images.forEach((img, i) => {
        let baseX, baseY;

        if (images.length === 4) {
            baseX = startX + (i % 2) * (IMG_W + GAP);
            baseY = GAP + Math.floor(i / 2) * (IMG_H + GAP);
        } else {
            baseX = startX;
            baseY = GAP + i * (IMG_H + GAP);
        }

        let x = baseX + parseInt(tx.value);
        let y = baseY + parseInt(ty.value);

        let rot = parseFloat(rotate.value) * Math.PI / 180;
        let scVal = parseFloat(scale.value);
        let scMapped = scVal >= 0 ? (1 + scVal / 100) : (1 + scVal / 200);
        let sc  = clampScale(scMapped);


        let brightCSS  = 100 + parseInt(brightness.value);
        let contrastCSS= 100 + parseInt(contrast.value);
        let saturateCSS= 100 + parseInt(saturation.value);
        let expCSS     = brightCSS * (1 + parseInt(exposure.value) / 100);
        expCSS         = Math.round(Math.max(0, expCSS));
        let binerVal   = parseInt(biner.value);
        let grayVal    = Math.max(0, parseInt(grayscale.value));
        let grayFilter = (binerVal !== 0) ? "" : `grayscale(${grayVal}%)`;

        ctx.save();

        let cx = x + IMG_W / 2;
        let cy = y + IMG_H / 2;

        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(sc, sc);

        ctx.filter = `
            brightness(${expCSS}%)
            contrast(${contrastCSS}%)
            saturate(${saturateCSS}%)
            ${grayFilter}
        `;

        ctx.drawImage(img, -IMG_W / 2, -IMG_H / 2, IMG_W, IMG_H);

        ctx.restore();
        ctx.filter = "none";

        if (parseInt(temperature.value) !== 0) {
            applyTemperature(baseX, baseY, IMG_W, IMG_H);
        }

        if (binerVal !== 0) {
            let threshold = 128 + binerVal;
            applyBiner(baseX, baseY, IMG_W, IMG_H, threshold);
        }
    });

    drawText();
}

//fungsi temperature
function applyTemperature(x, y, w, h) {
    let t = parseInt(temperature.value) / 100; // -1 s/d +1, 0=netral

    let imgData = ctx.getImageData(
        Math.round(x * SCALE),
        Math.round(y * SCALE),
        Math.round(w * SCALE),
        Math.round(h * SCALE)
    );

    let d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
        d[i]     = Math.max(0, Math.min(255, d[i]     + t * 80)); // R naik = hangat
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] - t * 80)); // B turun = hangat
    }

    ctx.putImageData(imgData, Math.round(x * SCALE), Math.round(y * SCALE));
}

// fungsi biner
function applyBiner(x, y, w, h, threshold) {
    let imgData = ctx.getImageData(
        Math.round(x * SCALE),
        Math.round(y * SCALE),
        Math.round(w * SCALE),
        Math.round(h * SCALE)
    );

    let d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
        let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        let val  = gray > threshold ? 255 : 0;
        d[i]     = val;
        d[i + 1] = val;
        d[i + 2] = val;
        // alpha tidak diubah
    }

    ctx.putImageData(imgData, Math.round(x * SCALE), Math.round(y * SCALE));
}

//teks
function drawText() {
    ctx.fillStyle = "#333";
    ctx.font      = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        "@citrabooth " + new Date().toLocaleDateString(),
        realWidth / 2,
        realHeight - 40
    );
}

//button
function downloadFoto() {
    const a    = document.createElement("a");
    a.download = "citrabooth.png";
    a.href     = canvas.toDataURL("image/png");
    a.click();
}

function ulang() {
    localStorage.removeItem("foto");
    window.location.href = "kamera.html";
}
updateLabel();