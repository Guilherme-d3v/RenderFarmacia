// Função para alternar a visibilidade da navbar
function toggleNav() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// JavaScript para o carrossel
const carouselInner = document.querySelector('.carousel-inner');
const carouselItems = document.querySelectorAll('.carousel-item');
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');
const indicators = document.querySelectorAll('.carousel-indicators span');

let currentIndex = 0;

function updateCarousel() {
    const offset = -currentIndex * 100;
    carouselInner.style.transform = `translateX(${offset}%)`;

    // Atualiza os indicadores
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
    });
}

prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = carouselItems.length - 1;
    }
    updateCarousel();
});

nextButton.addEventListener('click', () => {
    if (currentIndex < carouselItems.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    updateCarousel();
});

// Adiciona interação aos indicadores
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
    });
});

// Carrossel automático (opcional)
setInterval(() => {
    if (currentIndex < carouselItems.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    updateCarousel();
}, 5000); // Muda a cada 5 segundos

document.addEventListener('DOMContentLoaded', function() {
    const cartOverlay = document.getElementById('cart-overlay');
    const openCartButton = document.getElementById('open-cart-button');
    const closeCartButton = document.getElementById('close-cart-button');
    const cartItems = document.getElementById('cart-items');

    if (openCartButton) {
        openCartButton.addEventListener('click', () => {
            atualizarCarrinho();
            cartOverlay.style.display = 'flex';
        });
    }

    if (closeCartButton) {
        closeCartButton.addEventListener('click', () => {
            cartOverlay.style.display = 'none';
        });
    }

    function atualizarCarrinho() {
        fetch('/cart_data')
            .then(response => response.json())
            .then(data => {
                cartItems.innerHTML = '';

                if (data && data.cart && data.cart.length > 0) { // Verificação adicional
                    const table = document.createElement('table');
                    const headerRow = table.insertRow();
                    headerRow.insertCell().textContent = 'Produto';
                    headerRow.insertCell().textContent = 'Quantidade';

                    data.cart.forEach(item => {
                        const row = table.insertRow();
                        row.insertCell().textContent = item.product;
                        row.insertCell().textContent = item.quantity;
                    });

                    cartItems.appendChild(table);
                } else {
                    cartItems.innerHTML = '<p>O carrinho está vazio.</p>';
                }
            })
            .catch(error => {
                console.error("Erro ao carregar dados do carrinho:", error);
                cartItems.innerHTML = '<p>Erro ao carregar o carrinho.</p>'; // Mensagem de erro
            });
    }


    function addToCart(productId, quantity = 1) {
      fetch('/add_to_cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `product_id=${productId}&quantity=${quantity}`
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`); // Lança erro para ser capturado
        }
        return response.json();
      })
      .then(data => {
        atualizarCarrinho();
      })
      .catch(error => {
        console.error("Erro ao adicionar ao carrinho:", error);
        // Aqui você pode adicionar feedback visual para o usuário sobre o erro
        alert("Ocorreu um erro ao adicionar o produto ao carrinho. Tente novamente mais tarde.");
      });
    }
});