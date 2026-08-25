/* =====================================================
   GIR KITCHENWARE STUDIO
   ADMIN PANEL - FIREBASE
   ===================================================== */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =====================================================
   FIREBASE CONFIG
   ===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyCsMqYCSwNPNpLsBqELJEMn3F-SASfa0lM",
  authDomain: "gir-kitchenware-studio.firebaseapp.com",
  projectId: "gir-kitchenware-studio",
  storageBucket: "gir-kitchenware-studio.firebasestorage.app",
  messagingSenderId: "691904856522",
  appId: "1:691904856522:web:885b408e89f26c73b70f33",
  measurementId: "G-4M27C2P958"
};


/* =====================================================
   INITIALIZE FIREBASE
   ===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


/* =====================================================
   ELEMENTS
   ===================================================== */

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

const offerPriceInput =
  document.getElementById("offerPrice");

const categoryInput =
  document.getElementById("category");

const descriptionInput =
  document.getElementById("description");


let editingProduct = null;


/* =====================================================
   LOGIN
   ===================================================== */

loginBtn.addEventListener("click", async () => {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  if (!email || !password) {

    loginMessage.textContent =
      "Email અને Password નાખો.";

    return;
  }

  loginMessage.textContent =
    "Login થઈ રહ્યું છે...";

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


/* =====================================================
   AUTH STATE
   ===================================================== */

onAuthStateChanged(auth, (user) => {

  if (user) {

    loginBox.style.display = "none";

    dashboard.style.display = "block";

    loadProducts();

  } else {

    loginBox.style.display = "block";

    dashboard.style.display = "none";

  }

});


/* =====================================================
   LOGOUT
   ===================================================== */

logoutBtn.addEventListener("click", async () => {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

  }

});


/* =====================================================
   PHOTO PREVIEW
   ===================================================== */

photo.addEventListener("change", () => {

  const file = photo.files[0];

  if (!file) {

    preview.style.display = "none";

    preview.src = "";

    return;

  }

  preview.src =
    URL.createObjectURL(file);

  preview.style.display = "block";

});


/* =====================================================
   ADD / UPDATE PRODUCT
   ===================================================== */

saveBtn.addEventListener("click", async () => {

  const name =
    nameInput.value.trim();

  const price =
    priceInput.value.trim();

  const offerPrice =
    offerPriceInput.value.trim();

  const category =
    categoryInput.value.trim();

  const description =
    descriptionInput.value.trim();

  const file =
    photo.files[0];


  /* -------------------------
     VALIDATION
     ------------------------- */

  if (!name) {

    status.textContent =
      "Product Name નાખો.";

    return;

  }


  if (!category) {

    status.textContent =
      "Category નાખો.";

    return;

  }


  if (!editingProduct && !file) {

    status.textContent =
      "Product Photo પસંદ કરો.";

    return;

  }


  saveBtn.disabled = true;

  status.textContent =
    "Product save થઈ રહ્યું છે...";


  try {

    let imageUrl =
      editingProduct?.imageUrl || "";

    let storagePath =
      editingProduct?.storagePath || "";


    /* =========================
       UPLOAD NEW IMAGE
       ========================= */

    if (file) {

      const fileName =
        Date.now() + "_" +
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );


      const storagePathNew =
        "products/" + fileName;


      const storageRef =
        ref(
          storage,
          storagePathNew
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
        storagePathNew;


      /* =========================
         DELETE OLD IMAGE
         ========================= */

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
            "Old image delete skipped:",
            error
          );

        }

      }

    }


    /* =========================
       PRODUCT DATA
       ========================= */

    const productData = {

      name: name,

      price:
        Number(price || 0),

      offerPrice:
        Number(offerPrice || 0),

      category:
        category,

      description:
        description,

      imageUrl:
        imageUrl,

      storagePath:
        storagePath,

      updatedAt:
        serverTimestamp()

    };


    /* =========================
       UPDATE PRODUCT
       ========================= */

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


    /* =========================
       ADD PRODUCT
       ========================= */

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


    /* =========================
       RESET
       ========================= */

    resetForm();

    await loadProducts();


  } catch (error) {

    console.error(error);

    status.textContent =
      "❌ Error: " +
      error.message;

  }


  saveBtn.disabled = false;

});


/* =====================================================
   LOAD PRODUCTS
   ===================================================== */

async function loadProducts() {

  productList.innerHTML =
    "<p>Loading products...</p>";


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


    snapshot.forEach(
      (productDoc) => {

        const product =
          productDoc.data();


        /* =========================
           PRODUCT CARD
           ========================= */

        const card =
          document.createElement("div");

        card.className =
          "product";


        const normalPrice =
          Number(
            product.price || 0
          ).toLocaleString("en-IN");


        const offerPrice =
          Number(
            product.offerPrice || 0
          ).toLocaleString("en-IN");


        card.innerHTML = `

          <img
            src="${escapeHtml(
              product.imageUrl || ""
            )}"
            alt="${escapeHtml(
              product.name || ""
            )}"
            onerror="
              this.style.display='none';
            "
          >


          <div class="product-info">

            <h3>
              ${escapeHtml(
                product.name || ""
              )}
            </h3>


            <div class="price">

              ₹${normalPrice}

              ${
                product.offerPrice
                  ? `
                    <span class="offer">
                      → ₹${offerPrice}
                    </span>
                  `
                  : ""
              }

            </div>


            <p>
              <strong>Category:</strong>
              ${escapeHtml(
                product.category || ""
              )}
            </p>


            <p>
              ${escapeHtml(
                product.description || ""
              )}
            </p>


            <div class="actions">

              <button
                class="edit"
                type="button">

                ✏️ Edit

              </button>


              <button
                class="delete"
                type="button">

                🗑️ Delete

              </button>

            </div>

          </div>

        `;


        productList.appendChild(card);


        /* =========================
           EDIT BUTTON
           ========================= */

        card
          .querySelector(".edit")
          .addEventListener(
            "click",
            () => {

              editProduct(
                productDoc.id,
                product
              );

            }
          );


        /* =========================
           DELETE BUTTON
           ========================= */

        card
          .querySelector(".delete")
          .addEventListener(
            "click",
            () => {

              deleteProduct(
                productDoc.id,
                product
              );

            }
          );

      }
    );


  } catch (error) {

    console.error(error);

    productList.innerHTML =
      "<p>Products load થઈ શક્યા નથી.</p>";

    status.textContent =
      "❌ Products load error: " +
      error.message;

  }

}


/* =====================================================
   EDIT PRODUCT
   ===================================================== */

function editProduct(
  id,
  product
) {

  editingProduct = {

    id,

    ...product

  };


  productId.value =
    id;


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


  photo.value = "";


  if (product.imageUrl) {

    preview.src =
      product.imageUrl;

    preview.style.display =
      "block";

  }


  const formTitle =
    document.getElementById(
      "formTitle"
    );


  if (formTitle) {

    formTitle.textContent =
      "✏️ Edit Product";

  }


  saveBtn.textContent =
    "Update Product";


  cancelBtn.style.display =
    "block";


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


/* =====================================================
   DELETE PRODUCT
   ===================================================== */

async function deleteProduct(
  id,
  product
) {

  const confirmDelete =
    confirm(
      "શું આ product delete કરવો છે?"
    );


  if (!confirmDelete) {

    return;

  }


  status.textContent =
    "Product delete થઈ રહ્યું છે...";


  try {

    /* =========================
       DELETE FIRESTORE DATA
       ========================= */

    await deleteDoc(

      doc(
        db,
        "products",
        id
      )

    );


    /* =========================
       DELETE STORAGE IMAGE
       ========================= */

    if (
      product.storagePath
    ) {

      try {

        const imageRef =
          ref(
            storage,
            product.storagePath
          );


        await deleteObject(
          imageRef
        );


      } catch (error) {

        console.log(
          "Photo delete skipped:",
          error
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


/* =====================================================
   CANCEL EDIT
   ===================================================== */

cancelBtn.addEventListener(
  "click",
  () => {

    resetForm();

  }
);


/* =====================================================
   RESET FORM
   ===================================================== */

function resetForm() {

  editingProduct = null;


  productId.value =
    "";


  nameInput.value =
    "";


  priceInput.value =
    "";


  offerPriceInput.value =
    "";


  categoryInput.value =
    "";


  descriptionInput.value =
    "";


  photo.value =
    "";


  preview.src =
    "";


  preview.style.display =
    "none";


  const formTitle =
    document.getElementById(
      "formTitle"
    );


  if (formTitle) {

    formTitle.textContent =
      "➕ Add Product";

  }


  saveBtn.textContent =
    "Add Product";


  cancelBtn.style.display =
    "none";

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}
