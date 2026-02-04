const API = "http://localhost:5000/items";

const lista = document.getElementById("lista");
const form = document.getElementById("form");

const filtroTipo = document.getElementById("filtro-tipo");
const filtroStatus = document.getElementById("filtro-status");

let editandoId = null;

// Carregando os Itens do JSOn
function carregar() {
    lista.innerHTML = "Carregando...";

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
            lista.innerHTML = "";

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
                <li class="border-b py-2 flex justify-between items-center">
                    <div>
                        <strong>${item.titulo}</strong>
                        (${item.tipo}) -
                        R$ ${item.valor || 0} -
                        ${item.status} -
                        ${item.data || ""}
                    </div>
                    <div>
                        <button onclick="editarItem(${item.id})" class="text-blue-500 mr-2">
                            Editar
                        </button>
                        <button onclick="editarStatus(${item.id})" class="text-yellow-500 mr-2">
                            Status
                        </button>
                        <button onclick="remover(${item.id})" class="text-red-500">
                            Remover
                        </button>
                    </div>
                </li>`;
            });

            document.getElementById("saldo").innerText =
                "Saldo: R$ " + (totalEntrada - totalSaida);
        })
        .catch(err => {
            lista.innerHTML = err.message;
        });
}

// CRUD dos Itens
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
            alert("Item salvo com sucesso!");
        })
        .catch(err => {
            alert(err.message);
        });
};

/* =====================
   EDITAR ITEM (PUT)
===================== */
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

/* =====================
   REMOVER ITEM
===================== */
function remover(id) {
    fetch(`${API}/${id}`, { method: "DELETE" })
        .then(() => carregar());
}

/* =====================
   ALTERAR STATUS (PATCH)
===================== */
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

/* =====================
   FILTROS
===================== */
filtroTipo.onchange = carregar;
filtroStatus.onchange = carregar;

/* =====================
   INICIALIZAÇÃO
===================== */
carregar();
