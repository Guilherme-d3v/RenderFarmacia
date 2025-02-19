// Função para alternar a exibição do menu de navegação (navbar) em dispositivos móveis.
function toggleNav() {
    // Seleciona o elemento que contém os links da navbar.
    const navLinks = document.querySelector('.nav-links');
    // Alterna (adiciona ou remove) a classe 'active' para exibir ou ocultar o menu.
    navLinks.classList.toggle('active');
}

// =========================
// Código do Carrossel
// =========================

// Seleciona o contêiner que envolve todos os slides do carrossel.
const carouselInner = document.querySelector('.carousel-inner');
// Seleciona todos os itens (slides) do carrossel.
const carouselItems = document.querySelectorAll('.carousel-item');
// Seleciona os botões de navegação: anterior e próximo.
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');
// Seleciona os indicadores (bolinhas) que representam cada slide.
const indicators = document.querySelectorAll('.carousel-indicators span');

let currentIndex = 0; // Índice do slide atualmente visível

// Função para atualizar a posição do carrossel e os indicadores
function updateCarousel() {
    // Calcula o deslocamento (offset) com base no índice atual.
    const offset = -currentIndex * 100;
    // Aplica uma transformação para mover os slides horizontalmente.
    carouselInner.style.transform = `translateX(${offset}%)`;

    // Atualiza os indicadores: ativa o indicador correspondente ao slide atual.
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
    });
}

// Adiciona um evento de clique para o botão "anterior"
prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--; // Move para o slide anterior
    } else {
        // Se estiver no primeiro slide, volta para o último
        currentIndex = carouselItems.length - 1;
    }
    updateCarousel(); // Atualiza o carrossel
});

// Adiciona um evento de clique para o botão "próximo"
nextButton.addEventListener('click', () => {
    if (currentIndex < carouselItems.length - 1) {
        currentIndex++; // Avança para o próximo slide
    } else {
        // Se estiver no último slide, retorna ao primeiro
        currentIndex = 0;
    }
    updateCarousel(); // Atualiza o carrossel
});

// Adiciona eventos de clique aos indicadores para permitir a navegação direta pelo slide
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        currentIndex = index; // Define o slide atual com base no indicador clicado
        updateCarousel();
    });
});

// Carrossel automático: alterna o slide a cada 5 segundos
setInterval(() => {
    if (currentIndex < carouselItems.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    updateCarousel();
}, 5000); // Intervalo de 5000ms (5 segundos)

// =========================
// Lógica do Carrinho de Compras (LocalStorage)
// =========================

// Tenta recuperar os itens do carrinho salvos no localStorage; se não houver, inicia com um array vazio.
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// Função para adicionar um item ao carrinho.
// Recebe o nome do produto e o preço.
function adicionarAoCarrinho(nome, preco) {
    // Verifica se o item já existe no carrinho (com base no nome do produto)
    const itemExistente = carrinho.find(item => item.nome === nome);

    if (itemExistente) {
        // Se o item já existe, incrementa a quantidade
        itemExistente.quantidade += 1;
    } else {
        // Caso contrário, adiciona o item com quantidade 1
        carrinho.push({ nome, preco, quantidade: 1 });
    }

    // Atualiza o localStorage com o carrinho modificado
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho(); // Atualiza a exibição do carrinho
    alert(`${nome} adicionado ao carrinho!`);
}

// Função para exibir o carrinho (mostra o overlay)
function abrirCarrinho() {
    document.getElementById('cart-overlay').style.display = 'flex';
    atualizarCarrinho();
}

// Função para fechar o overlay do carrinho
function fecharCarrinho() {
    document.getElementById('cart-overlay').style.display = 'none';
}

// Função para atualizar a exibição do carrinho com os itens e o total
function atualizarCarrinho() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const contador = document.getElementById('contador-carrinho');

    // Limpa o conteúdo atual da lista de itens
    cartItems.innerHTML = '';
    let total = 0;

    // Para cada item no carrinho, cria um elemento para exibir os detalhes e o botão de remover
    carrinho.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <span>${item.nome} - R$ ${item.preco.toFixed(2)} x ${item.quantidade}</span>
            <button onclick="removerDoCarrinho('${item.nome}')">Remover</button>
        `;
        cartItems.appendChild(itemElement);
        total += item.preco * item.quantidade; // Calcula o total do carrinho
    });

    // Atualiza o texto do total e o contador de itens
    cartTotal.textContent = total.toFixed(2);
    contador.textContent = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
}

// Função para remover um item do carrinho com base no nome
function removerDoCarrinho(nome) {
    // Filtra o carrinho removendo o item que corresponda ao nome
    carrinho = carrinho.filter(item => item.nome !== nome);
    localStorage.setItem('carrinho', JSON.stringify(carrinho)); // Atualiza o localStorage
    atualizarCarrinho();
}

// =========================
// Integração com o Backend (opcional)
// =========================

// Função para buscar dados do carrinho a partir do backend (rota /cart_data)
function fetchCartData() {
    fetch('/cart_data')
        .then(response => response.json())
        .then(data => {
            // Se o backend retornar dados para o carrinho, atualiza o carrinho local
            if (data && data.cart && data.cart.length > 0) {
                carrinho = data.cart; // Atualiza o carrinho com os dados do backend
                atualizarCarrinho();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados do carrinho:', error);
        });
}

// Função para adicionar um item ao carrinho via requisição ao backend
// Recebe o productId e a quantidade (padrão é 1)
function addToCart(productId, quantity = 1) {
    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        // Envia os dados do produto e a quantidade no corpo da requisição
        body: `product_id=${productId}&quantity=${quantity}`
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Após adicionar, atualiza os dados do carrinho do backend
        fetchCartData();
    })
    .catch(error => {
        console.error("Erro ao adicionar ao carrinho:", error);
        alert("Ocorreu um erro ao adicionar o produto ao carrinho. Tente novamente mais tarde.");
    });
}

// =========================
// Inicialização: Atualiza e carrega o carrinho ao carregar a página
// =========================
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do overlay do carrinho e os botões de abrir e fechar
    const cartOverlay = document.getElementById('cart-overlay');
    const openCartButton = document.getElementById('open-cart-button');
    const closeCartButton = document.getElementById('close-cart-button');

    // Se o botão para abrir o carrinho existir, adiciona o evento de clique para chamar abrirCarrinho()
    if (openCartButton) {
        openCartButton.addEventListener('click', abrirCarrinho);
    }
    // Se o botão para fechar o carrinho existir, adiciona o evento de clique para chamar fecharCarrinho()
    if (closeCartButton) {
        closeCartButton.addEventListener('click', fecharCarrinho);
    }

    // Tenta buscar os dados do carrinho do backend (se implementado) e atualiza o carrinho local
    fetchCartData();
    atualizarCarrinho();
});


// Adicionar ao carrinho
function adicionarAoCarrinho(produto_id, quantidade) {
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
            // Exiba a mensagem de erro para o usuário
        } else {
            console.log(data.message);
            // Atualize a exibição do carrinho
            atualizarCarrinho();
        }
    });
}

// Obter dados do carrinho
function atualizarCarrinho() {
    fetch('/carrinho')
    .then(response => response.json())
    .then(data => {
        // Atualize a exibição do carrinho com os dados recebidos
        console.log(data);
    });
}