
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

// Lógica do Carrinho
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

function adicionarAoCarrinho(nome, preco) {
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ nome, preco, quantidade: 1 });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
    alert(`${nome} adicionado ao carrinho!`);
}

function abrirCarrinho() {
    document.getElementById('cart-overlay').style.display = 'flex';
    atualizarCarrinho();
}

function fecharCarrinho() {
    document.getElementById('cart-overlay').style.display = 'none';
}

function atualizarCarrinho() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const contador = document.getElementById('contador-carrinho');

    cartItems.innerHTML = '';
    let total = 0;

    carrinho.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <span>${item.nome} - R$ ${item.preco.toFixed(2)} x ${item.quantidade}</span>
            <button onclick="removerDoCarrinho('${item.nome}')">Remover</button>
        `;
        cartItems.appendChild(itemElement);
        total += item.preco * item.quantidade;
    });

    cartTotal.textContent = total.toFixed(2);
    contador.textContent = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
}

function removerDoCarrinho(nome) {
    carrinho = carrinho.filter(item => item.nome !== nome);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
}

// Integração com o backend (opcional)
function fetchCartData() {
    fetch('/cart_data')
        .then(response => response.json())
        .then(data => {
            if (data && data.cart && data.cart.length > 0) {
                carrinho = data.cart; // Atualiza o carrinho com os dados do backend
                atualizarCarrinho();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados do carrinho:', error);
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        fetchCartData(); // Atualiza o carrinho após adicionar um item
    })
    .catch(error => {
        console.error("Erro ao adicionar ao carrinho:", error);
        alert("Ocorreu um erro ao adicionar o produto ao carrinho. Tente novamente mais tarde.");
    });
}

// Atualiza o carrinho ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const cartOverlay = document.getElementById('cart-overlay');
    const openCartButton = document.getElementById('open-cart-button');
    const closeCartButton = document.getElementById('close-cart-button');

    if (openCartButton) {
        openCartButton.addEventListener('click', abrirCarrinho);
    }

    if (closeCartButton) {
        closeCartButton.addEventListener('click', fecharCarrinho);
    }

    fetchCartData(); // Carrega os dados do carrinho do backend (se necessário)
    atualizarCarrinho(); // Atualiza o carrinho com os dados locais
});

