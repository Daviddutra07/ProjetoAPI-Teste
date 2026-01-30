from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

ARQUIVO = "items.json"
TIPOS_PERMITIDOS = ["entrada", "saida"]
STATUS_PERMITIDOS = ["ativo", "concluido", "arquivado"]

# --- Funções Auxiliares ---
def carregar_dados():
    if not os.path.exists(ARQUIVO): return []
    with open(ARQUIVO, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_dados(items):
    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

# --- Rotas ---

@app.route("/items/summary", methods=["GET"])
def obter_resumo():
    items = carregar_dados()
    # Filtra apenas o que não está arquivado para o resumo (opcional)
    ativos = [i for i in items if i["status"] != "arquivado"]
    
    total_entradas = sum(i["valor"] for i in ativos if i["tipo"] == "entrada")
    total_saidas = sum(i["valor"] for i in ativos if i["tipo"] == "saida")
    
    return jsonify({
        "total_entradas": total_entradas,
        "total_saidas": total_saidas,
        "saldo": total_entradas - total_saidas,
        "quantidade_itens": len(ativos)
    }), 200

@app.route("/items", methods=["GET"])
def listar_items():
    items = carregar_dados()
    tipo = request.args.get("tipo")
    status = request.args.get("status")

    if tipo: items = [i for i in items if i["tipo"] == tipo]
    if status: items = [i for i in items if i["status"] == status]
    
    return jsonify(items[::-1]), 200 # Retorna os mais recentes primeiro

@app.route("/items", methods=["POST"])
def criar_item():
    dados = request.json
    items = carregar_dados()

    novo_item = {
        "id": max([i["id"] for i in items], default=0) + 1,
        "titulo": dados.get("titulo", "Sem título").strip(),
        "tipo": dados.get("tipo", "saida"),
        "status": dados.get("status", "ativo"),
        "valor": float(dados.get("valor", 0)),
        "data": dados.get("data")
    }

    items.append(novo_item)
    salvar_dados(items)
    return jsonify(novo_item), 201

@app.route("/items/<int:item_id>", methods=["DELETE"])
def deletar_item(item_id):
    items = carregar_dados()
    novos_items = [i for i in items if i["id"] != item_id]
    salvar_dados(novos_items)
    return jsonify({"message": "Removido"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)