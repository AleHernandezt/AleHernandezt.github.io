"""Lee las próximas salidas publicadas en tripealo.app y las guarda en assets/data/trips.json.

La home de Tripealo (Next.js) incluye en su HTML las experiencias con fecha de salida.
Este script las extrae, se queda con las próximas salidas (una por experiencia) y
escribe un JSON pequeño que la landing lee en el navegador. Lo ejecuta la GitHub Action
.github/workflows/update-trips.yml; también puede correrse a mano: python3 scripts/update_trips.py
"""
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.request

SOURCE = "https://www.tripealo.app/"
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "data" / "trips.json"
LIMIT = 6  # la página muestra 3; guardamos algunas de reserva por si alguna fecha pasa antes del próximo update


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "alehernandezt.github.io trips updater"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8")


def flight_payload(html):
    """Une los fragmentos self.__next_f.push([1,"..."]) ya decodificados."""
    chunks = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
    return "".join(json.loads(c) for c in chunks)


def extract_items(text):
    decoder = json.JSONDecoder()
    items = []
    for m in re.finditer(r'\{"id":"\d{4}-\d{2}-\d{2}-[^"]+","experiencia":\{', text):
        try:
            obj, _ = decoder.raw_decode(text, m.start())
        except ValueError:
            continue
        if isinstance(obj, dict) and obj.get("fechaSalida") and obj.get("experiencia"):
            items.append(obj)
    return items


def clean(item):
    e = item["experiencia"]
    title = re.sub(r"^[^\wÁÉÍÓÚÑáéíóúñ]+", "", e.get("titulo") or "").strip()
    return {
        "id": e.get("id"),
        "title": title.title() if title.isupper() else title,
        "destination": e.get("destinationName"),
        "date": item["fechaSalida"],
        "price": e.get("precio"),
        "agency": e.get("agencia"),
        "image": e.get("imagen"),
        "tags": [t.get("name") for t in (e.get("tags") or []) if t.get("name")][:2],
        "url": SOURCE.rstrip("/") + item.get("detailHref", "/"),
    }


def main():
    html = fetch(SOURCE)
    items = extract_items(flight_payload(html) or html)
    if not items:
        print("No se encontraron salidas; se conserva el JSON anterior.", file=sys.stderr)
        return 1

    today = dt.date.today().isoformat()
    seen, trips = set(), []
    for item in sorted(items, key=lambda i: i["fechaSalida"]):
        trip = clean(item)
        if trip["date"] < today or trip["id"] in seen:
            continue
        seen.add(trip["id"])
        trips.append(trip)
        if len(trips) == LIMIT:
            break

    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = {"source": SOURCE, "updated": dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"), "trips": trips}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(trips)} salidas guardadas en {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
