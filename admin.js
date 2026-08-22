import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyCsMqYCSwNPNpLsBqELJEMn3F-SASfa0lM",
  authDomain: "gir-kitchenware-studio.firebaseapp.com",
  projectId: "gir-kitchenware-studio",
  storageBucket: "gir-kitchenware-studio.firebasestorage.app",
  messagingSenderId: "691904856522",
  appId: "1:691904856522:web:885b408e89f26c73b70f33",
  measurementId: "G-4M27C2P958"
};


/* =========================
   INITIALIZE FIREBASE
========================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


/* =========================
   ELEMENTS
========================= */

const loginBox = document.getElementById("loginBox");

const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");

const logoutBtn = document.getElementById("logoutBtn");

const loginMessage = document.getElementById("loginMessage");

const status = document.getElementById("status");

const saveBtn = document.getElementById("saveBtn");

const cancelBtn = document.getElementById("cancelBtn");

const productList = document.getElementById("productList");

const photo = document.getElementById("photo");

const preview = document.getElementById("preview");

const productId = document.getElementById("productId");

const nameInput = document.getElementById("name");

const priceInput = document.getElementById("price");

const offerPriceInput = document.getElementById("offerPrice");

const categoryInput = document.getElementById("category");

const descriptionInput = document.getElementById("description");


let editingProduct = null;


/* =========================
   LOGIN
========================= */

loginBtn.addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value;

  if (!email || !password) {

    loginMessage.textContent =
      "Email અને Password નાખો.";

    return;
  }

  loginMessage.textContent = "Login થઈ રહ્યું છે...";

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    loginMessage.textContent = "";

  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      "Login failed. Email અથવા Password ચેક કરો.";

  }

});


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, user => {

  if (user) {

    loginBox.style.display = "none";

    dashboard.style.display = "block";

    loadProducts();

  } else {

    loginBox.style.display = "block";

    dashboard.style.display = "none";

  }

});


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

});


/* =========================
   PHOTO PREVIEW
========================= */

photo.addEventListener("change", () => {

  const file = photo.files[0];

  if (!file) {

    preview.style.display = "none";

    return;
  }

  preview.src = URL.createObjectURL(file);

  preview.style.display = "block";

});


/* =========================
   ADD / UPDATE PRODUCT
========================= */

saveBtn.addEventListener("click", async () => {

  const name = nameInput.value.trim();

  const price = priceInput.value.trim();

  const offerPrice = offerPriceInput.value.trim();

  const category = categoryInput.value.trim();

  const description = descriptionInput.value.trim();

  const file = photo.files[0];


  if (!name) {

    status.textContent = "Product Name નાખો.";

    return;

  }


  if (!editingProduct && !file) {

    status.textContent =
      "Product Photo પસંદ કરો.";

    return;

  }


  saveBtn.disabled = true;

  status.textContent = "Saving...";


  try {

    let imageUrl =
      editingProduct?.imageUrl || "";

    let storagePath =
      editingProduct?.storagePath || "";


    /* Upload new image */

    if (file) {

      const fileName =
        Date.now() + "_" + file.name;

      const storageRef =
        ref(
          storage,
          "products/" + fileName
        );


      await uploadBytes(
        storageRef,
        file
      );


      imageUrl =
        await getDownloadURL(
          storageRef
        );


      storagePath =
        "products/" + fileName;


      /* Delete old photo */

      if (
        editingProduct &&
        editingProduct.storagePath
      ) {

        try {

          const oldRef =
            ref(
              storage,
              editingProduct.storagePath
            );

          await deleteObject(oldRef);

        } catch (error) {

          console.log(
            "Old image delete skipped"
          );

        }

      }

    }


    const productData = {

      name,

      price: Number(price || 0),

      offerPrice:
        Number(offerPrice || 0),

      category,

      description,

      imageUrl,

      storagePath,

      updatedAt:
        serverTimestamp()

    };


    /* UPDATE */

    if (editingProduct) {

      await updateDoc(

        doc(
          db,
          "products",
          editingProduct.id
        ),

        productData

      );

      status.textContent =
        "✅ Product update થઈ ગયું.";

    }


    /* ADD */

    else {

      await addDoc(

        collection(
          db,
          "products"
        ),

        {

          ...productData,

          createdAt:
            serverTimestamp()

        }

      );

      status.textContent =
        "✅ Product add થઈ ગયું.";

    }


    resetForm();

    await loadProducts();


  } catch (error) {

    console.error(error);

    status.textContent =
      "❌ Error: " + error.message;

  }


  saveBtn.disabled = false;

});


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  productList.innerHTML =
    "Loading...";


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "products"
        )
      );


    productList.innerHTML = "";


    if (snapshot.empty) {

      productList.innerHTML =
        "<p>હજુ કોઈ product નથી.</p>";

      return;

    }


    snapshot.forEach(productDoc => {

      const product =
        productDoc.data();


      const card =
        document.createElement("div");

      card.className =
        "product";


      card.innerHTML = `

        <img
          src="${product.imageUrl || ""}"
          alt="${escapeHtml(product.name || "")}">

        <div class="product-info">

          <h3>
            ${escapeHtml(product.name || "")}
          </h3>

          <div class="price">

            ₹${product.price || 0}

            ${
              product.offerPrice
                ? `<span class="offer">
                    → ₹${product.offerPrice}
                  </span>`
                : ""
            }

          </div>

          <p>
            ${escapeHtml(product.category || "")}
          </p>

          <p>
            ${escapeHtml(product.description || "")}
          </p>

          <div class="actions">

            <button
              class="edit"
              data-id="${productDoc.id}">
              ✏️ Edit
            </button>

            <button
              class="delete"
              data-id="${productDoc.id}">
              🗑️ Delete
            </button>

          </div>

        </div>

      `;


      productList.appendChild(card);


      card
        .querySelector(".edit")
        .addEventListener(
          "click",
          () => editProduct(
            productDoc.id,
            product
          )
        );


      card
        .querySelector(".delete")
        .addEventListener(
          "click",
          () => deleteProduct(
            productDoc.id,
            product
          )
        );

    });


  } catch (error) {

    console.error(error);

    productList.innerHTML =
      "<p>Products load થઈ શક્યા નથી.</p>";

  }

}


/* =========================
   EDIT PRODUCT
========================= */

function editProduct(id, product) {

  editingProduct = {

    id,

    ...product

  };


  productId.value = id;

  nameInput.value =
    product.name || "";

  priceInput.value =
    product.price || "";

  offerPriceInput.value =
    product.offerPrice || "";

  categoryInput.value =
    product.category || "";

  descriptionInput.value =
    product.description || "";


  if (product.imageUrl) {

    preview.src =
      product.imageUrl;

    preview.style.display =
      "block";

  }


  document.getElementById(
    "formTitle"
  ).textContent =
    "✏️ Edit Product";


  saveBtn.textContent =
    "Update Product";


  cancelBtn.style.display =
    "block";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================
   DELETE PRODUCT
========================= */

async function deleteProduct(
  id,
  product
) {

  const confirmDelete =
    confirm(
      "શું આ product delete કરવો છે?"
    );


  if (!confirmDelete) return;


  try {

    await deleteDoc(
      doc(
        db,
        "products",
        id
      )
    );


    if (product.storagePath) {

      try {

        await deleteObject(
          ref(
            storage,
            product.storagePath
          )
        );

      } catch (error) {

        console.log(
          "Photo delete skipped"
        );

      }

    }


    status.textContent =
      "🗑️ Product delete થઈ ગયું.";

    await loadProducts();


  } catch (error) {

    console.error(error);

    status.textContent =
      "❌ Delete error: " +
      error.message;

  }

}


/* =========================
   CANCEL EDIT
========================= */

cancelBtn.addEventListener(
  "click",
  resetForm
);


/* =========================
   RESET FORM
========================= */

function resetForm() {

  editingProduct = null;

  productId.value = "";

  nameInput.value = "";

  priceInput.value = "";

  offerPriceInput.value = "";

  categoryInput.value = "";

  descriptionInput.value = "";

  photo.value = "";

  preview.src = "";

  preview.style.display = "none";


  document.getElementById(
    "formTitle"
  ).textContent =
    "➕ Add Product";


  saveBtn.textContent =
    "Add Product";


  cancelBtn.style.display =
    "none";

}


/* =========================
   BASIC HTML ESCAPE
========================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}
