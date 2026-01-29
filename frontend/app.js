const API = "http://localhost:5000/items";
const lista = document.getElementById("lista");
const form = document.getElementById("form");

const filtroTipo = document.getElementById("filtro-tipo");
const filtroStatus = document.getElementById("filtro-status");

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
        .then(r => r.json())
        .then(dados => {
            lista.innerHTML = "";
            let totalEntrada = 0;
            let totalSaida = 0;

            dados.forEach(item => {
                if (item.tipo === "entrada") totalEntrada += item.valor || 0;
                if (item.tipo === "saida") totalSaida += item.valor || 0;

                lista.innerHTML += `
                <li class="border-b py-2 flex justify-between items-center">
                    <div>
                        <strong>${item.titulo}</strong> (${item.tipo}) - R$ ${item.valor || 0} - ${item.status} - ${item.data || ""}
                    </div>
                    <div>
                        <button onclick="editarStatus(${item.id})" class="text-yellow-500 mr-2">Status</button>
                        <button onclick="remover(${item.id})" class="text-red-500">Remover</button>
                    </div>
                </li>`;
            });

            document.getElementById("saldo").innerText = "Saldo: R$ " + (totalEntrada - totalSaida);
        })
        .catch(() => lista.innerHTML = "Erro ao carregar itens");
}

// Salvar item
form.onsubmit = e => {
    e.preventDefault();

    const item = {
        titulo: document.getElementById("titulo").value,
        tipo: document.getElementById("tipo").value,
        status: document.getElementById("status").value,
        valor: Number(document.getElementById("valor").value),
        data: document.getElementById("data").value
    };

    fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
    })
    .then(r => r.json())
    .then(() => {
        form.reset();
        carregar();
    });
};

// Remover item
function remover(id) {
    fetch(`${API}/${id}`, { method: "DELETE" })
        .then(() => carregar());
}

// Alterar status (ciclo: ativo → concluido → arquivado)
function editarStatus(id) {
    fetch(`${API}/${id}`)
        .then(r => r.json())
        .then(item => {
            let novoStatus;
            if (item.status === "ativo") novoStatus = "concluido";
            else if (item.status === "concluido") novoStatus = "arquivado";
            else novoStatus = "ativo";

            fetch(`${API}/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: novoStatus })
            })
            .then(() => carregar());
        });
}

// Filtragem
filtroTipo.onchange = carregar;
filtroStatus.onchange = carregar;

// Carregar itens ao iniciar
carregar();
