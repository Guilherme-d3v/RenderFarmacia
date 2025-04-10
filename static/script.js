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
// Código do Carrossel (SEM ALTERAÇÕES)
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
// Lógica do Carrinho de Compras (SEM ALTERAÇÕES)
// =========================

function abrirCarrinho() {
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.style.display = 'flex';
        atualizarCarrinho();
    } else {
        console.error('Elemento com ID "cart-overlay" não encontrado.');
    }
}

function fecharCarrinho() {
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.style.display = 'none';
    } else {
        console.error('Elemento com ID "cart-overlay" não encontrado.');
    }
}

function atualizarCarrinho() {
    fetch('/carrinho', { credentials: 'include' }) // Adicione credentials
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const cartItems = document.getElementById('cart-items');
            const cartTotalElement = document.getElementById('cart-total'); // Renomeei para clareza
            const contador = document.getElementById('contador-carrinho');

            cartItems.innerHTML = '';

            if (data.error) {
                cartItems.innerHTML = `<p>${data.error}</p>`;
                if (cartTotalElement) cartTotalElement.textContent = 'Total: R$ 0.00'; // Garante que o total seja resetado em caso de erro
                if (contador) contador.textContent = '0';
            } else if (data.itens && data.itens.length > 0) { // Verifica se data.itens existe e não está vazio
                data.itens.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('cart-item');
                    itemElement.innerHTML = `
                        <span>${item.produto.nome} - R$ ${item.produto.preco.toFixed(2)} x ${item.quantidade}</span>
                        <button onclick="removerDoCarrinho(${item.id})">Remover</button>
                    `;
                    cartItems.appendChild(itemElement);
                });
                if (cartTotalElement) cartTotalElement.textContent = `Total: R$ ${data.total.toFixed(2)}`; // Usa o total retornado do backend
                if (contador) {
                    let totalItens = 0;
                    data.itens.forEach(item => {
                        totalItens += item.quantidade;
                    });
                    contador.textContent = totalItens;
                }
            } else {
                cartItems.innerHTML = '<p>O carrinho está vazio.</p>';
                if (cartTotalElement) cartTotalElement.textContent = 'Total: R$ 0.00';
                if (contador) contador.textContent = '0';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar carrinho:', error);
            const cartItems = document.getElementById('cart-items');
            cartItems.innerHTML = `<p>Por favor efetue login.</p>`;
            const cartTotalElement = document.getElementById('cart-total');
            if (cartTotalElement) cartTotalElement.textContent = 'Total: R$ 0.00';
            const contador = document.getElementById('contador-carrinho');
            if (contador) contador.textContent = '0';
        });
}

function removerDoCarrinho(item_id) {
    fetch(`/remover_do_carrinho/${item_id}`, { method: 'DELETE' })
    .then(response => response.json())
    .then(data => atualizarCarrinho());
}

function adicionarAoCarrinho(produto_id, quantidade) {
    if (!/^\d+$/.test(quantidade)) {
        alert('Quantidade inválida!');
        return;
    }

    fetch('/adicionar_ao_carrinho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', // Adicione esta linha
        body: `produto_id=${produto_id}&quantidade=${quantidade}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            atualizarCarrinho();
        }
    });
}

// =========================
// Lógica de Login/Logout (PARTE CORRIGIDA)
// =========================
document.addEventListener('DOMContentLoaded', function() {
    // Carrinho (mantido igual)
    const openCartButton = document.getElementById('open-cart-button');
    const closeCartButton = document.getElementById('close-cart-button');
    if (openCartButton) openCartButton.addEventListener('click', abrirCarrinho);
    if (closeCartButton) closeCartButton.addEventListener('click', fecharCarrinho);
    atualizarCarrinho();

    // Elementos do login
    const loginModal = document.getElementById('login-modal');
    const loginContainer = document.querySelector('.login-container');

    // Função de verificação de sessão
    async function verificarSessao() {
        try {
            const response = await fetch('/verificar_sessao', { credentials: 'include' });
            return await response.json();
        } catch (error) {
            return { usuarioLogado: false };
        }
    }

    if (loginContainer && loginModal) {
        loginContainer.addEventListener('click', async (e) => {
            e.preventDefault();
            const sessao = await verificarSessao();
    
            if (sessao.usuarioLogado) {
                try {
                    const userResponse = await fetch('/obter_usuario', { credentials: 'include' });
                    if (!userResponse.ok) {
                        throw new Error('Erro ao obter usuário');
                    }
                    const userData = await userResponse.json();
                    if (document.getElementById('user-nome')){
                        document.getElementById('user-nome').textContent = userData.nome;
                    }
                    document.querySelector('[data-state="logged-in"]').classList.add('show-modal');
                    document.querySelector('[data-state="logged-in"]').classList.remove('hide-modal');
                    document.querySelector('[data-state="login"]').classList.add('hide-modal');
                    document.querySelector('[data-state="login"]').classList.remove('show-modal');
                } catch (error) {
                    console.error('Erro:', error);
                    // Mostrar mensagem de erro ao usuário, se necessário
                }
            } else {
                document.querySelector('[data-state="login"]').classList.add('show-modal');
                document.querySelector('[data-state="login"]').classList.remove('hide-modal');
                document.querySelector('[data-state="logged-in"]').classList.add('hide-modal');
                document.querySelector('[data-state="logged-in"]').classList.remove('show-modal');
            }
            loginModal.classList.add('show-modal');
            loginModal.classList.remove('hide-modal');
        });
    }

   // Função para fechar o modal
   function closeModal() {
    loginModal.classList.add('hide-modal');
    loginModal.classList.remove('show-modal');
}

// Fecha o modal (login)
const closeLoginModalLogin = document.getElementById('close-login-modal-login');
if (closeLoginModalLogin) {
    closeLoginModalLogin.addEventListener('click', closeModal);
}

// Fecha o modal (logged-in)
const closeLoginModalLoggedIn = document.getElementById('close-login-modal-logged-in');
if (closeLoginModalLoggedIn) {
    closeLoginModalLoggedIn.addEventListener('click', closeModal);
}

// Fecha o modal se clicar fora do conteúdo
window.addEventListener('click', function(event) {
    if (event.target === loginModal) {
        closeModal();
    }
});

    // Login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new URLSearchParams(new FormData(loginForm));

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    credentials: 'include',
                    body: formData
                });
                
                const data = await response.json();
                if (data.error) {
                    alert(data.error);
                } else {
                    closeModal(); // Chama a função para fechar o modal
                }
            } catch (error) {
                console.error("Erro no login:", error);
            }
        });
    }

    // Logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await fetch('/logout', { method: 'POST', credentials: 'include' });
                closeModal(); // Chama a função para fechar o modal
            } catch (error) {
                console.error('Erro no logout:', error);
            }
        });
    }
});

// =========================
// Lógica de Cadastro (modal cadastro)
document.addEventListener("DOMContentLoaded", function() {
    const loginModal = document.getElementById("login-modal");
    const registerModal = document.getElementById("register-modal");

    const openRegisterButton = document.getElementById("open-register-modal");
    const closeRegisterButton = document.getElementById("close-register-modal");

    openRegisterButton.addEventListener("click", function() {
        loginModal.classList.add("hide-modal");
        loginModal.classList.remove("show-modal");
        registerModal.classList.add("show-modal");
        registerModal.classList.remove("hide-modal");
    });

    closeRegisterButton.addEventListener("click", function() {
        registerModal.classList.add("hide-modal");
        registerModal.classList.remove("show-modal");
        loginModal.classList.add("show-modal");
        loginModal.classList.remove("hide-modal");
    });
});
document.getElementById("register-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nome = document.getElementById("register-nome").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const birth = document.getElementById("register-birth").value;
    const cpf = document.getElementById("register-cpf").value;
    const telefone = document.getElementById("register-telefone").value;

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, password, birth, cpf, telefone })
    });

    const data = await response.json();
    alert(data.message);

    if (data.success) {
        const registerModal = document.getElementById("register-modal");
        registerModal.classList.add("hide-modal");
        registerModal.classList.remove("show-modal");
    }
});

//======== LOGICA PASS RECOVER ==========//

// Funções para o modal de recuperação de senha
function openRecoveryModal() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('recovery-modal').style.display = 'flex';
}

function closeRecoveryModal() {
    document.getElementById('recovery-modal').style.display = 'none';
}

// Event listeners para o modal de recuperação
document.getElementById('open-recovery-modal')?.addEventListener('click', function(e) {
    e.preventDefault();
    openRecoveryModal();
});

document.querySelector('.close-recovery-modal')?.addEventListener('click', closeRecoveryModal);
document.getElementById('back-to-login')?.addEventListener('click', function() {
    closeRecoveryModal();
    document.getElementById('login-modal').style.display = 'flex';
});

// Envio do formulário de recuperação
document.getElementById('recovery-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validação básica
    if (!email || !email.includes('@')) {
        alert('Por favor, insira um e-mail válido');
        return;
    }
    
    // Feedback visual
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    try {
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            closeRecoveryModal();
        } else {
            alert(data.error || 'Erro ao processar solicitação');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Link de Recuperação';
    }
});

// Fechar modal ao clicar fora
window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('recovery-modal')) {
        closeRecoveryModal();
    }
});