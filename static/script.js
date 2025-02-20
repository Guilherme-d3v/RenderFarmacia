// Função para alternar a exibição do menu de navegação (navbar) em dispositivos móveis.
function toggleNav() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// =========================
// Código do Carrossel
// =========================

const carouselInner = document.querySelector('.carousel-inner');
const carouselItems = document.querySelectorAll('.carousel-item');
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');
const indicators = document.querySelectorAll('.carousel-indicators span');

let currentIndex = 0;

function updateCarousel() {
    const offset = -currentIndex * 100;
    carouselInner.style.transform = `translateX(${offset}%)`;

    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
    });
}

prevButton.addEventListener('click', () => {
    currentIndex = (currentIndex > 0) ? currentIndex - 1 : carouselItems.length - 1;
    updateCarousel();
});

nextButton.addEventListener('click', () => {
    currentIndex = (currentIndex < carouselItems.length - 1) ? currentIndex + 1 : 0;
    updateCarousel();
});

indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
    });
});

setInterval(() => {
    currentIndex = (currentIndex < carouselItems.length - 1) ? currentIndex + 1 : 0;
    updateCarousel();
}, 5000);

// =========================
// Lógica do Carrinho de Compras
// =========================

// Função para abrir o carrinho (mostra o overlay)
function abrirCarrinho() {
    document.getElementById('cart-overlay').style.display = 'flex';
    atualizarCarrinho();
}

// Função para fechar o overlay do carrinho
function fecharCarrinho() {
    document.getElementById('cart-overlay').style.display = 'none';
}

// Função para atualizar a exibição do carrinho
function atualizarCarrinho() {
    fetch('/carrinho')
        .then(response => response.json())
        .then(data => {
            const cartItems = document.getElementById('cart-items');
            const cartTotal = document.getElementById('cart-total');
            const contador = document.getElementById('contador-carrinho');

            cartItems.innerHTML = ''; // Limpa o conteúdo anterior

            let total = 0;

            if (data && data.length > 0) {
                data.forEach(item => {
                    if (item.produto) {
                        const itemElement = document.createElement('div');
                        itemElement.classList.add('cart-item');
                        itemElement.innerHTML = `
                            <span><span class="math-inline">\{item\.produto\.nome\} \- R</span> ${item.produto.preco.toFixed(2)} x <span class="math-inline">\{item\.quantidade\}</span\>
<button onclick\="removerDoCarrinho\(</span>{item.id})">Remover</button>
                        `;
                        cartItems.appendChild(itemElement);
                        total += item.produto.preco * item.quantidade;
                    } else {
                        console.error('Estrutura de dados inválida:', item);
                    }
                });
            } else {
                cartItems.innerHTML = '<p>O carrinho está vazio.</p>';
            }

            cartTotal.textContent = total.toFixed(2);
            contador.textContent = data ? data.reduce((acc, item) => acc + item.quantidade, 0) : 0;
        })
        .catch(error => {
            console.error('Erro ao carregar dados do carrinho:', error);
        });
}

// Função para remover um item do carrinho com base no ID do produto
function removerDoCarrinho(item_id) {
    fetch(`/remover_do_carrinho/${item_id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.error);
        } else {
            console.log(data.message);
            atualizarCarrinho();
        }
    })
    .catch(error => {
        console.error('Erro ao remover item do carrinho:', error);
    });
}

// Função para adicionar um item ao carrinho
function adicionarAoCarrinho(produto_id, quantidade) {
    if (!/^\d+$/.test(quantidade)) {
        alert('Por favor, insira uma quantidade válida (número inteiro).');
        return;
    }

    fetch('/adicionar_ao_carrinho', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `produto_id=<span class="math-inline">\{produto\_id\}&quantidade\=</span>{quantidade}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.error);
        } else {
            console.log(data.message);
            atualizarCarrinho();
        }
    });
}

// =========================
// Inicialização: Atualiza e carrega o carrinho ao carregar a página
// =========================
document.addEventListener('DOMContentLoaded', () => {
    const openCartButton = document.getElementById('open-cart-button');
    const closeCartButton = document.getElementById('close-cart-button');

    if (openCartButton) {
        openCartButton.addEventListener('click', abrirCarrinho);
    }
    if (closeCartButton) {
        closeCartButton.addEventListener('click', fecharCarrinho);
    }

    atualizarCarrinho();
});

function exibirLogin() {
    document.getElementById('login-modal').setAttribute('data-state', 'login');
    document.querySelector('#login-modal [data-state="login"]').style.display = 'block';
    document.querySelector('#login-modal [data-state="logged-in"]').style.display = 'none';
}

function exibirUsuarioLogado(nome) {
    document.getElementById('login-modal').setAttribute('data-state', 'logged-in');
    document.querySelector('#login-modal [data-state="login"]').style.display = 'none';
    document.querySelector('#login-modal [data-state="logged-in"]').style.display = 'block';
    document.getElementById('user-nome').textContent = nome;
    console.log(nome);
}

// Abrir modal de login
document.querySelector('.login-container').addEventListener('click', function(event) {
    event.preventDefault();
    exibirLogin();
    document.getElementById('login-modal').style.display = 'block';
});

// Fechar modal de login
document.getElementById('close-login-modal').addEventListener('click', function() {
    document.getElementById('login-modal').style.display = 'none';
    console.log('Fechar clicado');
});

// Enviar formulário de login
document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Evita o recarregamento da página

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            email: email,
            password: password
        }) // Corrigido: agora envia corretamente
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            exibirUsuarioLogado(data.user.nome);
        }
    })
    .catch(error => console.error("Erro ao fazer login:", error));
});


// Logout
document.getElementById('logout-button').addEventListener('click', function() {
    fetch('/logout')
    .then(response =>{
        if (response.ok) {
            exibirLogin();
            alert(data.message);
        } else {
            alert('Erro ao fazer logout.');
        }
    });
});