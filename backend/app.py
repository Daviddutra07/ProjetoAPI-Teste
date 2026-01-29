from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

TIPOS_PERMITIDOS = ["entrada", "saida"]
STATUS_PERMITIDOS = ["ativo", "concluido", "arquivado"]


app = Flask(__name__)
CORS(app)

ARQUIVO = "items.json"

def ler_items():
    if not os.path.exists(ARQUIVO):
        return []

    with open(ARQUIVO, "r", encoding="utf-8") as f:
        return json.load(f)


def salvar_items(items):
    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


def proximo_id(items):
    if not items:
        return 1
    return max(item["id"] for item in items) + 1


def validar_item(dados):
    titulo = dados.get("titulo", "").strip()
    tipo = dados.get("tipo")
    status = dados.get("status")
    valor = dados.get("valor")

    if len(titulo) < 3:
        return "titulo é obrigatório e deve ter no mínimo 3 caracteres"

    if tipo not in TIPOS_PERMITIDOS:
        return f"tipo inválido. Use: {TIPOS_PERMITIDOS}"

    if status not in STATUS_PERMITIDOS:
        return f"status inválido. Use: {STATUS_PERMITIDOS}"

    if valor is not None and valor < 0:
        return "valor não pode ser negativo"

    return None

@app.route("/items", methods=["GET"])
def listar_items():
    items = ler_items()

    tipo = request.args.get("tipo")
    status = request.args.get("status")

    if tipo:
        items = [i for i in items if i["tipo"] == tipo]

    if status:
        items = [i for i in items if i["status"] == status]

    return jsonify(items), 200


@app.route("/items", methods=["POST"])
def criar_item():
    dados = request.json
    erro = validar_item(dados)

    if erro:
        return jsonify({"error": erro}), 400

    items = ler_items()

    novo_item = {
        "id": proximo_id(items),
        "titulo": dados["titulo"].strip(),
        "tipo": dados["tipo"],
        "status": dados["status"],
        "valor": dados.get("valor"),
        "data": dados.get("data")
    }

    items.append(novo_item)
    salvar_items(items)

    return jsonify(novo_item), 201


@app.route("/items/<int:item_id>", methods=["PUT"])
def editar_item(item_id):
    dados = request.json
    erro = validar_item(dados)

    if erro:
        return jsonify({"error": erro}), 400

    items = ler_items()

    for item in items:
        if item["id"] == item_id:
            item.update({
                "titulo": dados["titulo"].strip(),
                "tipo": dados["tipo"],
                "status": dados["status"],
                "valor": dados.get("valor"),
                "data": dados.get("data")
            })

            salvar_items(items)
            return jsonify(item), 200

    return jsonify({"error": "Item não encontrado"}), 404


@app.route("/items/<int:item_id>/status", methods=["PATCH"])
def atualizar_status(item_id):
    status = request.json.get("status")

    if status not in STATUS_PERMITIDOS:
        return jsonify({"error": f"status inválido. Use: {STATUS_PERMITIDOS}"}), 400

    items = ler_items()

    for item in items:
        if item["id"] == item_id:
            item["status"] = status
            salvar_items(items)
            return jsonify(item), 200

    return jsonify({"error": "Item não encontrado"}), 404


@app.route("/items/<int:item_id>", methods=["DELETE"])
def deletar_item(item_id):
    items = ler_items()
    novos_items = [i for i in items if i["id"] != item_id]

    if len(novos_items) == len(items):
        return jsonify({"error": "Item não encontrado"}), 404

    salvar_items(novos_items)
    return jsonify({"message": "Item removido"}), 200


if __name__ == "__main__":
    app.run(debug=True)