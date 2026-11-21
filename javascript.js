const API_URL = "https://6afee8a33a0e70bc8d542e5d.mockapi.io/productos";
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

const catalogo = document.getElementById("catalogo");
const formProducto = document.getElementById("form-producto");
const btnToggle = document.getElementById("btn-admin-toggle");
const panelAdmin = document.getElementById("panel-admin");
const contadorComprasEl = document.getElementById("contador-compras");

let modoAdmin = false;
let comprasRealizadas = 0;
let listaProductos = [];

btnToggle.addEventListener("click", () => {
  if (!panelAdmin.classList.contains("oculto")) {
    panelAdmin.classList.add("oculto");
    modoAdmin = false;
    renderizarCatalogo(listaProductos);
    return;
  }

  const usuario = prompt("Usuario administrador:");
  if (usuario === null) return;

  const clave = prompt("Contraseña:");
  if (clave === null) return;

  if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
    panelAdmin.classList.remove("oculto");
    modoAdmin = true;
    renderizarCatalogo(listaProductos);
  } else {
    alert("Usuario o contraseña incorrectos.");
  }
});

async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    listaProductos = await res.json();
    renderizarCatalogo(listaProductos);
  } catch (error) {
    catalogo.innerHTML = "<p>Error al cargar los productos desde MockAPI.</p>";
  }
}

function renderizarCatalogo(productos) {
  catalogo.innerHTML = "";

  if (!Array.isArray(productos) || productos.length === 0) {
    catalogo.innerHTML = "<p>No hay productos disponibles por el momento.</p>";
    return;
  }

  productos.forEach((prod) => {
    const stockActual = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 5;
    const sinStock = stockActual <= 0;
    const precioNumero = Number(prod.precio) || 0;

    const imgSrc = prod.imagen && prod.imagen.trim() !== ""
      ? prod.imagen.trim()
      : "https://upload.wikimedia.org/wikipedia/commons/7/71/Arduino-uno-perspective-transparent.png";

    const nombreEscapado = String(prod.nombre || "Producto").replace(/'/g, "\\'");

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div>
        <img src="${imgSrc}" alt="${prod.nombre || "Componente"}" />
        <h3>${prod.nombre || "Sin nombre"}</h3>
      </div>
      <div>
        <p class="precio">Bs. ${precioNumero.toFixed(2)}</p>
        <p class="stock ${sinStock ? "agotado" : ""}">
          ${sinStock ? "Agotado (0 disponibles)" : `Stock disponible: ${stockActual}`}
        </p>
      </div>
      <div>
        <button
          class="btn-comprar"
          ${sinStock ? "disabled" : ""}
          onclick="comprarProducto('${prod.id}', '${nombreEscapado}', ${stockActual})"
        >
          ${sinStock ? "Sin stock" : "🛒 Comprar"}
        </button>

        <div class="acciones-admin ${modoAdmin ? "" : "oculto"}">
          <button
            class="btn-editar"
            onclick="editarProducto('${prod.id}', '${nombreEscapado}', ${precioNumero}, ${stockActual})"
          >
            Editar
          </button>
          <button
            class="btn-eliminar"
            onclick="eliminarProducto('${prod.id}')"
          >
            Eliminar
          </button>
        </div>
      </div>
    `;
    catalogo.appendChild(card);
  });
}

async function comprarProducto(id, nombre, stockActual) {
  if (stockActual <= 0) return;

  const nuevoStock = stockActual - 1;

  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock: nuevoStock }),
  });

  comprasRealizadas++;
  contadorComprasEl.textContent = comprasRealizadas;
  alert(`¡Compra realizada de "${nombre}"! Stock restante: ${nuevoStock}.`);
  cargarProductos();
}

formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const stock = parseInt(document.getElementById("stock").value, 10);
  const imagen = document.getElementById("imagen").value.trim();

  if (!nombre || isNaN(precio) || isNaN(stock) || stock < 0) {
    alert("Completa bien el nombre, precio y stock.");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, precio, stock, imagen }),
  });

  formProducto.reset();
  cargarProductos();
});

async function editarProducto(id, nombreActual, precioActual, stockActual) {
  const nuevoPrecioStr = prompt(`Nuevo precio para "${nombreActual}":`, precioActual);
  if (nuevoPrecioStr === null) return;

  const nuevoStockStr = prompt(`Nuevo stock para "${nombreActual}":`, stockActual);
  if (nuevoStockStr === null) return;

  const nuevoPrecio = parseFloat(nuevoPrecioStr);
  const nuevoStock = parseInt(nuevoStockStr, 10);

  if (isNaN(nuevoPrecio) || nuevoPrecio < 0 || isNaN(nuevoStock) || nuevoStock < 0) {
    alert("Ingresa valores numéricos válidos.");
    return;
  }

  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ precio: nuevoPrecio, stock: nuevoStock }),
  });

  cargarProductos();
}

async function eliminarProducto(id) {
  const confirmar = confirm("¿Seguro que deseas eliminar este producto?");
  if (!confirmar) return;

  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  cargarProductos();
}

cargarProductos();