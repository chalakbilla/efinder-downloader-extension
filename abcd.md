// Find all tables on the page
const tables = document.querySelectorAll("table");

tables.forEach(table => {
    const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());

    // Check if headers match exactly
    const expectedHeaders = ["Document Name", "Photo Name", "Received Date"];
    const headersMatch = expectedHeaders.every((text, index) => headers[index] === text);

    if (headersMatch) {
        // Select all rows inside the tbody of this matching table
        const rows = table.querySelectorAll("tbody tr");

        // Loop through each row and add index to the first column
        rows.forEach((row, index) => {
            const firstCell = row.querySelector("td");
            if (firstCell) {
                // Prepend the index number (starting from 1)
                firstCell.innerHTML = `<strong>${index + 1}.</strong> ` + firstCell.innerHTML;
            }
        });
    }
});
