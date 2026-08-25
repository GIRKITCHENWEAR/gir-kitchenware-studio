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

  apiKey:
    "AIzaSyCsMqYCSwNPNpLsBqELJEMn3F-SASfa0lM",

  authDomain:
    "gir-kitchenware-studio.firebaseapp.com",

  projectId:
    "gir-kitchenware-studio",

  storageBucket:
    "gir-kitchenware-studio.firebasestorage.app",

  messagingSenderId:
    "691904856522",

  appId:
    "1:691904856522:web:885b408e89f26c73b70f33",

  measurementId:
    "G-4M27C2P958"

};


/* =====================================================
   INITIALIZE
   ===================================================== */

const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const storage =
  getStorage(app);


/* =====================================================
   ELEMENTS
   ===================================================== */

const loginScreen =
  document.getElementById("loginScreen");

const adminApp =
  document.getElementById("adminApp");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const loginBtn =
  document.getElementById("loginBtn");

const loginMsg =
  document.getElementById("loginMsg");

const logoutBtn =
  document.getElementById("logoutBtn");

const productForm =
  document.getElementById("productForm");

const productId =
  document.getElementById("productId");

const productName =
  document.getElementById("productName");

const productCategory =
  document.getElementById("productCategory");

const productPrice =
  document.getElementById("productPrice");

const productOfferPrice =
  document.getElementById("productOfferPrice");

const productDescription =
  document.getElementById("productDescription");

const productImage =
  document.getElementById("productImage");

const imagePreview =
  document.getElementById("imagePreview");

const saveProductBtn =
  document.getElementById("saveProductBtn");

const cancelEdit =
  document.getElementById("cancelEdit");

const formMsg =
  document.getElementById("formMsg");

const productList =
  document.getElementById("productList");

const count =
  document.getElementById("count");

const search =
  document.getElementById("search");

const formTitle =
  document.getElementById("formTitle");


let editingProduct = null;

let allProducts = [];


/* =====================================================
   LOGIN
   ===================================================== */

loginBtn.addEventListener(
  "click",
  async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      loginMsg.textContent =
        "Email અને Password નાખો.";

      return;

    }


    loginBtn.disabled = true;

    loginMsg.textContent =
      "Login થઈ રહ્યું છે...";


    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      loginMsg.textContent = "";


    } catch (error) {

      console.error(error);

      loginMsg.textContent =
        getLoginError(error.code);

    }


    loginBtn.disabled = false;

  }
);


/* =====================================================
   LOGIN ERROR
   ===================================================== */

function getLoginError(code) {

  switch (code) {

    case "auth/invalid-credential":
      return "Email અથવા Password ખોટો છે.";

    case "auth/user-not-found":
      return "Admin account મળ્યું નથી.";

    case "auth/wrong-password":
      return "Password ખોટો છે.";

    case "auth/invalid-email":
      return "Email address ખોટું છે.";

    case "auth/too-many-requests":
      return "ઘણા login attempts થયા છે. થોડા સમય પછી પ્રયાસ કરો.";

    default:
      return "Login failed. ફરી પ્રયાસ કરો.";

  }

}


/* =====================================================
   AUTH STATE
   ===================================================== */

onAuthStateChanged(
  auth,
  async (user) => {

    if (user) {

      loginScreen.classList.add("hidden");

      adminApp.classList.remove("hidden");

      await loadProducts();

    } else {

      loginScreen.classList.remove("hidden");

      adminApp.classList.add("hidden");

    }

  }
);


/* =====================================================
   LOGOUT
   ===================================================== */

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(error);

    }

  }
);


/* =====================================================
   IMAGE PREVIEW
   ===================================================== */

productImage.addEventListener(
  "change",
  () => {

    const file =
      productImage.files[0];


    if (!file) {

      imagePreview.src = "";

      imagePreview.classList.add(
        "hidden"
      );

      return;

    }


    if (!file.type.startsWith("image/")) {

      formMsg.textContent =
        "ફક્ત image file પસંદ કરો.";

      productImage.value = "";

      return;

    }


    const imageUrl =
      URL.createObjectURL(file);


    imagePreview.src =
      imageUrl;

    imagePreview.classList.remove(
      "hidden"
    );

  }
);


/* =====================================================
   ADD / UPDATE PRODUCT
   ===================================================== */

productForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const name =
      productName.value.trim();

    const category =
      productCategory.value.trim();

    const price =
      Number(productPrice.value || 0);

    const offerPrice =
      Number(
        productOfferPrice.value || 0
      );

    const description =
      productDescription.value.trim();

    const file =
      productImage.files[0];


    /* -------------------------
       VALIDATION
       ------------------------- */

    if (!name) {

      formMsg.textContent =
        "Product Name નાખો.";

      return;

    }


    if (!category) {

      formMsg.textContent =
        "Category નાખો.";

      return;

    }


    if (
      price < 0 ||
      offerPrice < 0
    ) {

      formMsg.textContent =
        "Price સાચી રીતે નાખો.";

      return;

    }


    if (
      offerPrice > 0 &&
      price > 0 &&
      offerPrice > price
    ) {

      formMsg.textContent =
        "Offer Price, Regular Price કરતાં વધારે ન હોવી જોઈએ.";

      return;

    }


    if (
      !editingProduct &&
      !file
    ) {

      formMsg.textContent =
        "Product Photo પસંદ કરો.";

      return;

    }


    saveProductBtn.disabled = true;

    formMsg.textContent =
      "Product save થઈ રહ્યું છે...";


    try {

      let imageUrl =
        editingProduct?.imageUrl || "";

      let storagePath =
        editingProduct?.storagePath || "";


      /* =========================
         UPLOAD IMAGE
         ========================= */

      if (file) {

        const safeFileName =
          file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );


        const fileName =
          Date.now() +
          "_" +
          safeFileName;


        const newStoragePath =
          "products/" +
          fileName;


        const storageRef =
          ref(
            storage,
            newStoragePath
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
          newStoragePath;


        /* =====================
           DELETE OLD IMAGE
           ===================== */

        if (
          editingProduct &&
          editingProduct.storagePath
        ) {

          try {

            const oldImageRef =
              ref(
                storage,
                editingProduct.storagePath
              );


            await deleteObject(
              oldImageRef
            );

          } catch (error) {

            console.log(
              "Old image delete skipped:",
              error
            );

          }

        }

      }


      /* =========================
         DATA
         ========================= */

      const productData = {

        name:

          name,

        category:

          category,

        price:

          price,

        offerPrice:

          offerPrice,

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
         UPDATE
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


        formMsg.textContent =
          "✅ Product update થઈ ગયું.";

      }


      /* =========================
         ADD
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


        formMsg.textContent =
          "✅ Product add થઈ ગયું.";

      }


      resetForm();

      await loadProducts();


    } catch (error) {

      console.error(error);

      formMsg.textContent =
        "❌ Error: " +
        error.message;

    }


    saveProductBtn.disabled = false;

  }
);


/* =====================================================
   LOAD PRODUCTS
   ===================================================== */

async function loadProducts() {

  productList.innerHTML =
    "<p>Products loading...</p>";


  try {

    const snapshot =
      await getDocs(

        collection(
          db,
          "products"
        )

      );


    allProducts = [];


    snapshot.forEach(
      (productDoc) => {

        allProducts.push({

          id:
            productDoc.id,

          ...productDoc.data()

        });

      }
    );


    renderProducts(
      allProducts
    );


  } catch (error) {

    console.error(error);

    productList.innerHTML =
      "<p>Products load થઈ શક્યા નથી.</p>";

    formMsg.textContent =
      "❌ Firestore Error: " +
      error.message;

  }

}


/* =====================================================
   RENDER PRODUCTS
   ===================================================== */

function renderProducts(
  products
) {

  productList.innerHTML = "";


  count.textContent =
    `${products.length} products`;


  if (!products.length) {

    productList.innerHTML =
      "<p>હજુ કોઈ product નથી.</p>";

    return;

  }


  products.forEach(
    (product) => {

      const card =
        document.createElement("div");

      card.className =
        "product";


      const regularPrice =
        Number(
          product.price || 0
        ).toLocaleString(
          "en-IN"
        );


      const offerPrice =
        Number(
          product.offerPrice || 0
        ).toLocaleString(
          "en-IN"
        );


      const image =
        product.imageUrl
          ? `
            <img
              src="${escapeHtml(
                product.imageUrl
              )}"
              alt="${escapeHtml(
                product.name || ""
              )}"
              onerror="
                this.style.display='none';
              "
            >
          `
          : "";


      const offer =
        product.offerPrice
          ? `
            <span class="offer">
              ₹${offerPrice}
            </span>
          `
          : "";


      card.innerHTML = `

        ${image}

        <div class="product-info">

          <h3>
            ${escapeHtml(
              product.name || ""
            )}
          </h3>

          <div class="price">

            ₹${regularPrice}

            ${offer}

          </div>

          <p>

            <strong>
              Category:
            </strong>

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
              type="button"
              class="edit"
            >
              ✏️ Edit
            </button>

            <button
              type="button"
              class="delete"
            >
              🗑️ Delete
            </button>

          </div>

        </div>

      `;


      productList.appendChild(
        card
      );


      /* =====================
         EDIT
         ===================== */

      card
        .querySelector(".edit")
        .addEventListener(
          "click",
          () => {

            editProduct(
              product
            );

          }
        );


      /* =====================
         DELETE
         ===================== */

      card
        .querySelector(".delete")
        .addEventListener(
          "click",
          () => {

            deleteProduct(
              product
            );

          }
        );

    }
  );

}


/* =====================================================
   SEARCH
   ===================================================== */

search.addEventListener(
  "input",
  () => {

    const query =
      search.value
        .trim()
        .toLowerCase();


    if (!query) {

      renderProducts(
        allProducts
      );

      return;

    }


    const filtered =
      allProducts.filter(
        (product) => {

          const name =
            String(
              product.name || ""
            ).toLowerCase();

          const category =
            String(
              product.category || ""
            ).toLowerCase();

          const description =
            String(
              product.description || ""
            ).toLowerCase();


          return (

            name.includes(query) ||

            category.includes(query) ||

            description.includes(query)

          );

        }
      );


    renderProducts(
      filtered
    );

  }
);


/* =====================================================
   EDIT PRODUCT
   ===================================================== */

function editProduct(
  product
) {

  editingProduct =
    product;


  productId.value =
    product.id;


  productName.value =
    product.name || "";


  productCategory.value =
    product.category || "";


  productPrice.value =
    product.price || "";


  productOfferPrice.value =
    product.offerPrice || "";


  productDescription.value =
    product.description || "";


  productImage.value =
    "";


  if (product.imageUrl) {

    imagePreview.src =
      product.imageUrl;

    imagePreview.classList.remove(
      "hidden"
    );

  }


  formTitle.textContent =
    "✏️ Edit Product";


  saveProductBtn.textContent =
    "Update Product";


  cancelEdit.classList.remove(
    "hidden"
  );


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


/* =====================================================
   DELETE PRODUCT
   ===================================================== */

async function deleteProduct(
  product
) {

  const confirmed =
    confirm(
      `શું "${product.name}" product delete કરવો છે?`
    );


  if (!confirmed) {

    return;

  }


  try {

    formMsg.textContent =
      "Product delete થઈ રહ્યું છે...";


    /* =========================
       DELETE FIRESTORE
       ========================= */

    await deleteDoc(

      doc(
        db,
        "products",
        product.id
      )

    );


    /* =========================
       DELETE IMAGE
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
          "Image delete skipped:",
          error
        );

      }

    }


    formMsg.textContent =
      "🗑️ Product delete થઈ ગયું.";


    await loadProducts();


  } catch (error) {

    console.error(error);

    formMsg.textContent =
      "❌ Delete Error: " +
      error.message;

  }

}


/* =====================================================
   CANCEL EDIT
   ===================================================== */

cancelEdit.addEventListener(
  "click",
  () => {

    resetForm();

  }
);


/* =====================================================
   RESET FORM
   ===================================================== */

function resetForm() {

  editingProduct =
    null;


  productForm.reset();


  productId.value =
    "";


  imagePreview.src =
    "";

  imagePreview.classList.add(
    "hidden"
  );


  formTitle.textContent =
    "Add Product";


  saveProductBtn.textContent =
    "Save Product";


  cancelEdit.classList.add(
    "hidden"
  );

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(
  value
) {

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
