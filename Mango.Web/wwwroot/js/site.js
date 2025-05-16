$(document).ready(function () {
    updateCartItemNumber();
});

function getUserId() {
    var jwtToken = getToken();
    if (!jwtToken) return;

    try {
        const payloadBase64 = jwtToken.split('.')[1]; // get payload
        const payloadJson = atob(payloadBase64); // decrypt base64
        const payload = JSON.parse(payloadJson); // Parse JSON

        console.log("Decoded Payload:", payload);

        return payload.sub || null; // retunr userId or sub if possible
    } catch (e) {
        console.error("Error decoding token:", e);
        return null;
    }
}
function getToken() {
    const name = "JWTToken"
    const cookieArr = document.cookie.split(";");

    for (let i = 0; i < cookieArr.length; i++) {
        const cookie = cookieArr[i].trim();

        // Tách tên và giá trị cookie
        if (cookie.startsWith(name + "=")) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}
function getCart() {
    var userId = getUserId();
    if (!userId) return;

    return new Promise((resolve, reject) => {
        $.ajax({
            url: `https://localhost:7777/api/cart/GetCart/${userId}`,
            type: "GET",
            headers: {
                "Authorization": "Bearer " + getToken()
            },
            success: function (response) {
                resolve(response.result);
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}
async function updateCartItemNumber() {
    var cartDto = await getCart();

    if (cartDto) {
        console.log(`CartDto: ${JSON.stringify(cartDto)}`);
        var cartItemNumber = parseInt(cartDto.cartDetails.length);
        const numberElement = $('<span>', {
            id: 'cartItemNumber',
            class: 'position-absolute top-10 start-100 translate-middle badge rounded-pill bg-danger',
            text: `${cartItemNumber}`
        });
        $('#cart').append(numberElement);
    } else {
        $('#cartItemNumber').remove();
    }
}
