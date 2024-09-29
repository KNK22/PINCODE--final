let postalData = [];

window.onload = function() {
    console.log("Starting to load CSV file...");
    Papa.parse('Locality_village_pincode_final_mar-2017.csv', {
        download: true,
        header: true,
        complete: function(results) {
            postalData = results.data;
            console.log("CSV data loaded:", postalData);
        },
        error: function(error) {
            console.error('Error loading CSV file:', error);
            document.getElementById('result').textContent = 'Failed to load postal code data.';
        }
    });

    // Set up Event Listeners
    document.getElementById('searchButton').addEventListener('click', searchPostalCode);
    document.getElementById('findPostalCodeBtn').addEventListener('click', locateUserPostalCode);
    document.getElementById('newSearchBtn').addEventListener('click', startNewSearch);
};

function searchPostalCode() {
    const searchButton = document.getElementById('searchButton');
    const spinner = document.getElementById('manualSearchSpinner');

    searchButton.textContent = 'Loading...';
    searchButton.disabled = true;
    spinner.style.display = 'inline-block';

    if (postalData.length === 0) {
        alert("Postal code data is not yet loaded. Please wait a moment and try again.");
        resetManualSearchButton();
        return;
    }

    const input = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');

    if (!input) {
        resultDiv.textContent = 'Please enter a locality, district, or state name.';
        resetManualSearchButton();
        return;
    }

    const results = postalData.filter(entry => {
        const locality = entry['Village/Locality name'] ? entry['Village/Locality name'].toLowerCase() : '';
        const subDist = entry['Sub-distname'] ? entry['Sub-distname'].toLowerCase() : '';
        const district = entry['Districtname'] ? entry['Districtname'].toLowerCase() : '';
        const state = entry['StateName'] ? entry['StateName'].toLowerCase() : '';

        return locality.includes(input) || subDist.includes(input) || district.includes(input) || state.includes(input);
    });

    if (results.length > 0) {
        displayResults(results, resultDiv);
    } else {
        resultDiv.textContent = 'No postal code found for the entered locality, district, or state.';
    }

    resetManualSearchButton();
}

function resetManualSearchButton() {
    const searchButton = document.getElementById('searchButton');
    const spinner = document.getElementById('manualSearchSpinner');
    searchButton.textContent = 'Search';
    searchButton.disabled = false;
    spinner.style.display = 'none';
}

function locateUserPostalCode() {
    const findPostalCodeBtn = document.getElementById('findPostalCodeBtn');
    const spinner = document.getElementById('locationSearchSpinner');
    
    findPostalCodeBtn.textContent = 'Searching...';
    findPostalCodeBtn.disabled = true;
    spinner.style.display = 'inline-block';

    if (!navigator.geolocation) {
        document.getElementById('result').textContent = 'Geolocation is not supported by your browser.';
        resetButton(findPostalCodeBtn, spinner, 'Search by Location');
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        console.log("Geolocation success:", position);
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
            headers: {
                'User-Agent': 'PostalCodeFinder/1.0 (example@example.com)'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const locality = data.address.city || data.address.town || data.address.village;
            if (locality) {
                searchPostalCodeByLocality(locality.toLowerCase());
            } else {
                document.getElementById('result').textContent = 'No locality information found at this location.';
            }
            resetButton(findPostalCodeBtn, spinner, 'Search by Location');
        })
        .catch(error => {
            console.error('Error during reverse geocoding:', error);
            document.getElementById('result').textContent = 'Failed to retrieve location details. Please try again.';
            resetButton(findPostalCodeBtn, spinner, 'Search by Location');
        });
    }, error => {
        console.error('Geolocation error:', error);
        document.getElementById('result').textContent = 'Unable to retrieve your location. Please ensure location services are enabled and try again.';
        resetButton(findPostalCodeBtn, spinner, 'Search by Location');
    });
}

function searchPostalCodeByLocality(locality) {
    const results = postalData.filter(entry => entry['Village/Locality name']?.toLowerCase().includes(locality));
    const resultDiv = document.getElementById('result');

    if (results.length > 0) {
        displayResults(results, resultDiv);
    } else {
        resultDiv.textContent = 'No results found for the specified locality.';
    }
}

function displayResults(results, resultDiv) {
    let resultHTML = '<ul>';
    results.forEach(entry => {
        resultHTML += `<li><strong>Locality/Village:</strong> ${entry['Village/Locality name'] || 'N/A'}, 
                       <strong>Sub-district:</strong> ${entry['Sub-distname'] || 'N/A'}, 
                       <strong>District:</strong> ${entry['Districtname'] || 'N/A'}, 
                       <strong>State:</strong> ${entry['StateName'] || 'N/A'} - 
                       <strong>Postal Code:</strong> ${entry['Pincode'] || 'N/A'}</li>`;
    });
    resultHTML += '</ul>';
    resultDiv.innerHTML = resultHTML;
    document.getElementById('newSearchBtn').style.display = 'block';
}

function startNewSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('newSearchBtn').style.display = 'none';
    
    resetButton(document.getElementById('searchButton'), document.getElementById('manualSearchSpinner'), 'Search');
    resetButton(document.getElementById('findPostalCodeBtn'), document.getElementById('locationSearchSpinner'), 'Search by Location');
}

function resetButton(button, spinner, text) {
    button.textContent = text;
    button.disabled = false;
    spinner.style.display = 'none';
}
