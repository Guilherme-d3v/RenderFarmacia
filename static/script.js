// Função para alternar a exibição do menu de navegação (navbar) em dispositivos móveis.
function toggleNav() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    } else {
        console.error('Elemento com classe "nav-links" não encontrado.');
    }
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
    if (carouselInner) {
        carouselInner.style.transform = `translateX(${offset}%)`;
    }
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
    });
}

if (prevButton) {
    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : carouselItems.length - 1;
        updateCarousel();
    });
}
if (nextButton) {
    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex < carouselItems.length - 1) ? currentIndex + 1 : 0;
        updateCarousel();
    });
}

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
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.style.display = 'flex';
        atualizarCarrinho();
    } else {
        console.error('Elemento com ID "cart-overlay" não encontrado.');
    }
}

// Função para fechar o overlay do carrinho
function fecharCarrinho() {
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.style.display = 'none';
    } else {
        console.error('Elemento com ID "cart-overlay" não encontrado.');
    }
}

// Função para atualizar a exibição do carrinho
function atualizarCarrinho() {
    fetch('/carrinho')
        .then(response => response.json())
        .then(data => {
            const cartItems = document.getElementById('cart-items');
            const cartTotal = document.getElementById('cart-total');
            const contador = document.getElementById('contador-carrinho');

            if (cartItems) {
                cartItems.innerHTML = ''; // Limpa o conteúdo anterior
            }

            let total = 0;

            if (data && data.length > 0) {
                data.forEach(item => {
                    if (item.produto) {
                        const itemElement = document.createElement('div');
                        itemElement.classList.add('cart-item');
                        itemElement.innerHTML = `
                            <span>${item.produto.nome} - R$ ${item.produto.preco.toFixed(2)} x ${item.quantidade}</span>
                            <button onclick="removerDoCarrinho(${item.id})">Remover</button>
                        `;
                        if (cartItems) {
                            cartItems.appendChild(itemElement);
                        }
                        total += item.produto.preco * item.quantidade;
                    } else {
                        console.error('Estrutura de dados inválida:', item);
                    }
                });
            } else {
                if (cartItems) {
                    cartItems.innerHTML = '<p>O carrinho está vazio.</p>';
                }
            }

            if (cartTotal) {
                cartTotal.textContent = total.toFixed(2);
            }
            if (contador) {
                contador.textContent = data ? data.reduce((acc, item) => acc + item.quantidade, 0) : 0;
            }
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
        body: `produto_id=${produto_id}&quantidade=${quantidade}`
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
// Inicialização e Lógica do Login
// =========================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa os botões do carrinho
    const openCartButton = document.getElementById('open-cart-button');
    const closeCartButton = document.getElementById('close-cart-button');

    if (openCartButton) {
        openCartButton.addEventListener('click', abrirCarrinho);
    }
    if (closeCartButton) {
        closeCartButton.addEventListener('click', fecharCarrinho);
    }
    atualizarCarrinho();

    // Função para verificar a sessão do usuário
    function verificarSessao() {
        return fetch('/verificar_sessao') // Supondo que você tenha uma rota no servidor para verificar a sessão
            .then(response => response.json())
            .then(data => data.usuarioLogado) // 'usuarioLogado' é verdadeiro ou falso dependendo do estado da sessão
            .catch(error => {
                console.error('Erro ao verificar a sessão:', error);
                return false;
            });
    }

    // Listener para abrir o modal de login
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        loginContainer.addEventListener('click', async function(event) {
            event.preventDefault();

            // Verifica se o usuário está logado
            const usuarioLogado = await verificarSessao();

            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                if (usuarioLogado) {
                    exibirUsuarioLogado(); // Exibe o modal no estado de "logged-in"
                } else {
                    exibirLogin(); // Exibe o modal no estado de "login"
                }
                loginModal.style.display = 'block';
            } else {
                console.error('Elemento com ID "login-modal" não encontrado.');
            }
        });
    } else {
        console.error('Elemento com classe "login-container" não encontrado.');
    }

    // Fechar modal na tela de login
    const closeLogin = document.getElementById('close-login-modal-login');
    if (closeLogin) {
        closeLogin.addEventListener('click', function() {
            document.getElementById('login-modal').style.display = 'none';
        });
    } else {
        console.error('Elemento com ID "close-login-modal-login" não encontrado.');
    }

    // Fechar modal na tela de usuário logado
    const closeLoggedIn = document.getElementById('close-login-modal-logged-in');
    if (closeLoggedIn) {
        closeLoggedIn.addEventListener('click', function() {
            document.getElementById('login-modal').style.display = 'none';
        });
    } else {
        console.error('Elemento com ID "close-login-modal-logged-in" não encontrado.');
    }

    // Listener para envio do formulário de login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
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
                })
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
    } else {
        console.error('Elemento com ID "login-form" não encontrado.');
    }

    // Listener para logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            fetch('/logout')
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    exibirLogin();
                    alert(data.message);
                } else {
                    alert('Erro ao fazer logout.');
                }
            })
            .catch(error => {
                alert('Erro ao fazer logout.');
                console.error(error);
            });
        });
    } else {
        console.error('Elemento com ID "logout-button" não encontrado.');
    }
});

// Funções reutilizáveis para exibir o modal em diferentes estados
function exibirLogin() {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) {
        console.error('Elemento com ID "login-modal" não encontrado.');
        return;
    }
    const loginSection = loginModal.querySelector('[data-state="login"]');
    const loggedInSection = loginModal.querySelector('[data-state="logged-in"]');
    if (!loginSection || !loggedInSection) {
        console.error('Elementos de estado do modal de login não encontrados.');
        return;
    }
    loginModal.setAttribute('data-state', 'login');
    loginSection.style.display = 'block';
    loggedInSection.style.display = 'none';
}

function exibirUsuarioLogado(nome) {
    const loginModal = document.getElementById('login-modal');
    if (!loginModal) {
        console.error('Elemento com ID "login-modal" não encontrado.');
        return;
    }
    const loginSection = loginModal.querySelector('[data-state="login"]');
    const loggedInSection = loginModal.querySelector('[data-state="logged-in"]');
    if (!loginSection || !loggedInSection) {
        console.error('Elementos de estado do modal de login não encontrados.');
        return;
    }
    loginModal.setAttribute('data-state', 'logged-in');
    loginSection.style.display = 'none';
    loggedInSection.style.display = 'block';
    const userNomeElement = document.getElementById('user-nome');
    if (userNomeElement) {
        userNomeElement.textContent = nome;
    }
    console.log(nome);
}

