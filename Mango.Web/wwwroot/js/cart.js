$(document).ready(function () {
    $(".decreaseQuantity").on("click", function (e) {
        e.preventDefault();
        var parent = $(this).closest(".cartDetails");
        var cartDetailsId = parent.data("cart-details-id");
        var countElement = $(this).siblings(".cartDetailsCount");

        var newQuantity = parseInt(countElement.val())-1;
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
        var newQuantity = parseInt(countElement.val()) +1;
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
        url: `https://localhost:7003/api/cart/UpdateQuantityCart/${cartDetailsId}/${quantity}`,
        type: "PATCH",
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
    $.ajax({
        url: `https://localhost:7003/api/cart/RemoveCart`,
        type: "POST",
        data: JSON.stringify(cartDetailsId),
        contentType: "application/json",
        success: function (result) {
            rowElement.remove();
            calculateCartTotal();
        },
        error: function (error) {
            console.log("Error: " + error);
        }
    });
}

function calculateCartTotal() {
    var priceEls = $(".cartItemPrice");
    var countEls = $(".cartDetailsCount");

    var total = 0;
    for (var i = 0; i < countEls.length; i++) {
        console.log($(priceEls[i]).text().substring(1))
        var price = parseFloat($(priceEls[i]).text().substring(1));
        var count = parseInt($(countEls[i]).val());

        total += price * count;
        
    }
    var orderTotal = $(".orderTotal");
    orderTotal.text("$ " + total.toFixed(2));
}