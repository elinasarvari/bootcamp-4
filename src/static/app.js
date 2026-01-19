document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();

      // Clear loading message
      capabilitiesList.innerHTML = "";

      // Populate capabilities list with registration form in each card
      Object.entries(capabilities).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";

        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultants ? details.consultants.length : 0;

        // Create consultants HTML with delete icons
        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<div class="consultants-section">
              <h5>Registered Consultants:</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(
                    (email) =>
                      `<li><span class="consultant-email">${email}</span><button class="delete-btn" data-capability="${name}" data-email="${email}" title="Remove consultant">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No consultants registered yet</em></p>`;

        // Registration form for this capability
        const registerFormHTML = `
          <form class="register-form" data-capability="${name}">
            <div class="form-group">
              <label for="email-${name}">Consultant Email:</label>
              <input type="email" id="email-${name}" required placeholder="your-email@slalom.com" />
            </div>
            <button type="submit" title="Register for ${name}">Register Expertise</button>
            <div class="message hidden"></div>
          </form>
        `;

        capabilityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Practice Area:</strong> ${details.practice_area}</p>
          <p><strong>Industry Verticals:</strong> ${details.industry_verticals ? details.industry_verticals.join(', ') : 'Not specified'}</p>
          <p><strong>Capacity:</strong> ${availableCapacity} hours/week available</p>
          <p><strong>Current Team:</strong> ${currentConsultants} consultants</p>
          <div class="consultants-container">
            ${consultantsHTML}
          </div>
          <div class="register-container">
            ${registerFormHTML}
          </div>
        `;

        capabilitiesList.appendChild(capabilityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      capabilitiesList.innerHTML =
        "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh capabilities list to show updated consultants
        fetchCapabilities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle registration for each capability
  capabilitiesList.addEventListener("submit", async (event) => {
    if (event.target.classList.contains("register-form")) {
      event.preventDefault();
      const form = event.target;
      const capability = form.getAttribute("data-capability");
      const emailInput = form.querySelector("input[type='email']");
      const email = emailInput.value.trim();
      const messageDiv = form.querySelector(".message");

      messageDiv.classList.remove("success", "error", "info");
      messageDiv.classList.add("hidden");

      if (!email) {
        messageDiv.textContent = "Please enter a valid email.";
        messageDiv.classList.add("error");
        messageDiv.classList.remove("hidden");
        return;
      }

      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, capability })
        });
        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = "Registration successful!";
          messageDiv.classList.add("success");
          messageDiv.classList.remove("hidden");
          form.reset();
          fetchCapabilities(); // Refresh list
        } else {
          messageDiv.textContent = result.error || "Registration failed.";
          messageDiv.classList.add("error");
          messageDiv.classList.remove("hidden");
        }
      } catch (err) {
        messageDiv.textContent = "Network error. Please try again.";
        messageDiv.classList.add("error");
        messageDiv.classList.remove("hidden");
      }
    }
  });

  // Initialize app
  fetchCapabilities();
});
