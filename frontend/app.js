const API = "http://localhost:5000/items";

const lista = document.getElementById("lista");
const form = document.getElementById("form");

const filtroTipo = document.getElementById("filtro-tipo");
const filtroStatus = document.getElementById("filtro-status");

const feedback = document.getElementById("feedback");
const loading = document.getElementById("loading");

const resumoEntradas = document.getElementById("resumo-entradas");
const resumoSaidas = document.getElementById("resumo-saidas");
const resumoSaldo = document.getElementById("resumo-saldo");

let editandoId = null;

// Mensagens de aviso
function mostrarFeedback(mensagem, tipo) {
    feedback.className = "p-3 rounded text-sm";

    if (tipo === "erro") {
        feedback.classList.add("bg-red-100", "text-red-700");
    } else {
        feedback.classList.add("bg-green-100", "text-green-700");
    }

    feedback.innerText = mensagem;
    feedback.classList.remove("hidden");

    setTimeout(() => {
        feedback.classList.add("hidden");
    }, 3000);
}

// Puxar itens do json
function carregar() {
    loading.classList.remove("hidden");
    lista.innerHTML = "";

    let url = API;
    const tipo = filtroTipo.value;
    const status = filtroStatus.value;

    if (tipo || status) {
        const params = new URLSearchParams();
        if (tipo) params.append("tipo", tipo);
        if (status) params.append("status", status);
        url += "?" + params.toString();
    }

    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error("Erro ao buscar itens");
            }
            return res.json();
        })
        .then(dados => {
            let totalEntrada = 0;
            let totalSaida = 0;

            dados.forEach(item => {
                if (item.tipo === "entrada") {
                    totalEntrada += item.valor || 0;
                }

                if (item.tipo === "saida") {
                    totalSaida += item.valor || 0;
                }

                lista.innerHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="p-3 font-medium">${item.titulo}</td>
                    <td class="p-3 capitalize">${item.tipo}</td>
                    <td class="p-3 text-right">R$ ${item.valor || 0}</td>
                    <td class="p-3 capitalize">${item.status}</td>
                    <td class="p-3">${item.data || "-"}</td>
                    <td class="p-3 text-center space-x-2">
                        <button onclick="editarItem(${item.id})"
                            class="text-blue-600 hover:underline">
                            Editar
                        </button>
                        <button onclick="editarStatus(${item.id})"
                            class="text-yellow-600 hover:underline">
                            Status
                        </button>
                        <button onclick="remover(${item.id})"
                            class="text-red-600 hover:underline">
                            Remover
                        </button>
                    </td>
                </tr>`;
            });

            resumoEntradas.innerText = "R$ " + totalEntrada;
            resumoSaidas.innerText = "R$ " + totalSaida;
            resumoSaldo.innerText = "R$ " + (totalEntrada - totalSaida);
        })
        .catch(err => {
            mostrarFeedback(err.message, "erro");
        })
        .finally(() => {
            loading.classList.add("hidden");
        });
}

// Salvar item
form.onsubmit = function (e) {
    e.preventDefault();

    const item = {
        titulo: document.getElementById("titulo").value,
        tipo: document.getElementById("tipo").value,
        status: document.getElementById("status").value,
        valor: Number(document.getElementById("valor").value),
        data: document.getElementById("data").value
    };

    let metodo = "POST";
    let url = API;

    if (editandoId !== null) {
        metodo = "PUT";
        url = `${API}/${editandoId}`;
    }

    fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.error);
                });
            }
            return res.json();
        })
        .then(() => {
            form.reset();
            editandoId = null;
            carregar();
            mostrarFeedback("Item salvo com sucesso!", "sucesso");
        })
        .catch(err => {
            mostrarFeedback(err.message, "erro");
        });
};

// Editar Item
function editarItem(id) {
    fetch(`${API}/${id}`)
        .then(res => res.json())
        .then(item => {
            document.getElementById("titulo").value = item.titulo;
            document.getElementById("tipo").value = item.tipo;
            document.getElementById("status").value = item.status;
            document.getElementById("valor").value = item.valor || "";
            document.getElementById("data").value = item.data || "";

            editandoId = id;
        });
}

// Deletar item
function remover(id) {
    fetch(`${API}/${id}`, { method: "DELETE" })
        .then(() => carregar());
}

// Alterar Status
function editarStatus(id) {
    fetch(`${API}/${id}`)
        .then(res => res.json())
        .then(item => {
            let novoStatus = "ativo";

            if (item.status === "ativo") {
                novoStatus = "concluido";
            } else if (item.status === "concluido") {
                novoStatus = "arquivado";
            }

            fetch(`${API}/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: novoStatus })
            })
                .then(() => carregar());
        });
}

// Filtross
filtroTipo.onchange = carregar;
filtroStatus.onchange = carregar;

carregar();
