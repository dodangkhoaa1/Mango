$(document).ready(function () {
    getUserId();
    $(".decreaseQuantity").on("click", function (e) {
        e.preventDefault();
        var parent = $(this).closest(".cartDetails");
        var cartDetailsId = parent.data("cart-details-id");
        var countElement = $(this).siblings(".cartDetailsCount");

        var newQuantity = parseInt(countElement.val()) - 1;
        if (newQuantity <= 0) {
            removeItem(countElement.closest(".row"), cartDetailsId)
        } else {
            updateQuantity(countElement, cartDetailsId, newQuantity);
        }
    });

    $(".increaseQuantity").on("click", function (e) {
        e.preventDefault();
        var parent = $(this).closest(".cartDetails");
        var cartDetailsId = parent.data("cart-details-id");
        var countElement = $(this).siblings(".cartDetailsCount");
        var newQuantity = parseInt(countElement.val()) + 1;
        if (newQuantity <= 100) {
            updateQuantity(countElement, cartDetailsId, newQuantity);
        } else {
            countElement.val(100);
            updateQuantity(countElement, cartDetailsId, newQuantity);
        }
    });

    $(".cartDetailsCount").on("change input", function (e) {
        e.preventDefault();
        var parent = $(this).closest(".cartDetails");
        var cartDetailsId = parent.data("cart-details-id");

        if (parseInt($(this).val()) == 0) {
            removeItem($(this).closest(".row"), cartDetailsId)
        } else {
            if (isNaN(parseInt($(this).val())) || parseInt($(this).val()) < 0) {
                $(this).val(1);
            } else if (parseInt($(this).val()) > 100) {
                $(this).val(100);
            }
            updateQuantity($(this), cartDetailsId, parseInt($(this).val()));
        }
    })

    $(".deleteCartItem").on("click", function (e) {
        e.preventDefault();
        //get cartDetailsId
        var cartDetailsId = $(this).data("cart-details-id");
        //get row parent
        var parent = $(this).closest(".row");
        //remove cart item
        removeItem(parent, cartDetailsId);
    })
});

function updateQuantity(countElement, cartDetailsId, quantity) {
    $.ajax({
        url: `https://localhost:7777/api/cart/UpdateQuantityCart/${cartDetailsId}/${quantity}`,
        type: "PATCH",
        headers: {
            "Authorization": "Bearer " + getToken()
        },
        success: function (result) {
            countElement.val(result.result.count);
            calculateCartTotal();
        },
        error: function (error) {
            console.log("Error: " + error);
        }
    });
}

 function removeItem(rowElement, cartDetailsId) {
    var isContinue = confirm('The item will be delete. Are you sure to remove it?');
    if (!isContinue) {
        return;
    }
    $.ajax({
        url: `https://localhost:7777/api/cart/RemoveCart`,
        type: "POST",
        headers: {
            "Authorization": "Bearer " + getToken()
        },
        data: JSON.stringify(cartDetailsId),
        contentType: "application/json",
        success: async function (response) {
            //check the number item of cart
            //if there are items reamain
            var cartDto = await getCart();
            if (cartDto) {
                rowElement.remove();
                calculateCartTotal();
                updateCartItemNumber();
            } else {
                //else if there is no item remain -> display 
                var noShow = `<div class="text-center">
                <p>Please add items to cart.</p>
                <a href="/" class="btn btn-outline-warning mt-2 btn-sm">Continue Shopping</a>
                 </div>`;
                $('#cartIndex').html(noShow);
            }

        },
        error: function (error) {
            console.log("Error: " + error);
        }
    });
}
function getCouponByCode(code) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `https://localhost:7777/api/coupon/GetByCode/${code}`,
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


async function calculateCartTotal() {
    var priceEls = $(".cartItemPrice");
    var countEls = $(".cartDetailsCount");

    var total = 0;
    for (var i = 0; i < countEls.length; i++) {
        var price = parseFloat($(priceEls[i]).text().substring(1));
        var count = parseInt($(countEls[i]).val());

        var couponCode = $(".coupon-code").val();

        total += price * count;
    }

    if (couponCode != null && couponCode.trim() != "") {
        var couponDto = await getCouponByCode(couponCode);

        discountAmount = parseInt(couponDto.discountAmount);
        if (discountAmount != 0 && total >= couponDto.minAmount) {
            total -= discountAmount;
            if ($('.cartDiscount').length > 0) {
                $('.cartDiscount').text(`Order Discount : ${discountAmount.toFixed(2)}`);
            } else {
                $('#cartSummary').append(`<span class="cartDiscount text-success">Order Discount : ${discountAmount.toFixed(2)}</span>`);
            }
        } else if (total < couponDto.minAmount) {
            $('.cartDiscount').remove();
        }
    }
    var orderTotal = $(".cartTotal");
    orderTotal.text(`$${total.toFixed(2)}`);
    orderTotal.append('<br>');
}

