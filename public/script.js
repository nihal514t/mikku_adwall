// script.js

const modal = document.getElementById("popupModal");
const closeBtn = document.getElementById("closeBtn");
const whatsappBtn = document.getElementById("whatsappBtn");
const redirectBtn = document.getElementById("redirectBtn");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const gridContainer = document.querySelector('.grid');

// Placeholder for box data which will be fetched from the backend
let boxData = [];

// Fetch box data from the backend
async function fetchBoxData() {
  try {
    const response = await fetch('/get-boxes');
    if (!response.ok) throw new Error("Failed to load box data");
    boxData = await response.json();  // Fetch the box data
    generateGrid();  // Generate the grid after data is fetched
  } catch (error) {
    console.error("Error fetching box data:", error);
  }
}

// Generate the grid of boxes
function generateGrid() {
  gridContainer.innerHTML = ""; // Clear previous grid
  boxData.forEach(box => {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');

    // If box has an image, show the image
    if (box.imageUrl) {
      const img = document.createElement('img');
      img.src = box.imageUrl;
      img.alt = `Box ${box.id}`;
      gridItem.appendChild(img);
    } else {
      const message = box.isSold ? 'Sold' : 'Available';
      gridItem.innerHTML = `<p>${message}</p>`;
    }

    // Add click listener for each box
    gridItem.addEventListener('click', () => handleBoxClick(box));

    gridContainer.appendChild(gridItem);
  });
}

// Handle box click (show modal and WhatsApp button)
function handleBoxClick(box) {
  console.log(box);  // Debug: check if row and column are correctly logged

  // If the box is sold and has a redirect URL, navigate to it
  if (box.isSold && box.imageUrl && box.redirectUrl) {
    window.location.href = box.redirectUrl;
  } else {
    // If the box is available, show the modal with row and column information
    const message = `This box is available. Contact us to purchase Box [Row ${box.row}, Column ${box.col}]`;
    showModal(message, "Available Box", true);

    // Set up WhatsApp button for purchase
    whatsappBtn.onclick = () => {
      window.location.href = `https://wa.me/your-number?text=I%20want%20to%20buy%20Box%20[Row%20${box.row}%2C%20Column%20${box.col}]`;
    };
  }
}

// Show the modal with the box information
function showModal(message, title, showButtons) {
  popupTitle.textContent = title;
  popupMessage.textContent = message;  // The message should display the correct row and column
  modal.style.display = "block";
  whatsappBtn.style.display = showButtons ? "inline-block" : "none";
  redirectBtn.style.display = "none";
}

// Close the modal when the close button is clicked
closeBtn.onclick = () => modal.style.display = "none";

// Close the modal if the user clicks outside of it
window.onclick = (e) => e.target === modal && (modal.style.display = "none");

// Initialize the grid on page load
window.onload = fetchBoxData;  // Fetch and display data on page load
