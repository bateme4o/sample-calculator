document.addEventListener('DOMContentLoaded', () => {

    // Inputs
    const inputStartDate = document.getElementById('start-date');
    const inputEndDate = document.getElementById('end-date');
    const inputRevenue = document.getElementById('revenue');
    const inputAov = document.getElementById('aov');
    
    // Sliders
    const sliderLeadRate = document.getElementById('lead-rate');
    const sliderProspectRate = document.getElementById('prospect-rate');
    
    // Slider Labels
    const valLeadRate = document.getElementById('lead-rate-val');
    const valProspectRate = document.getElementById('prospect-rate-val');

    // UI Stats Cards
    const valProspects = document.getElementById('val-prospects');
    const valLeads = document.getElementById('val-leads');
    const valCustomers = document.getElementById('val-customers');
    const pctLeads = document.getElementById('pct-leads');
    const pctCustomers = document.getElementById('pct-customers');
    const barLeads = document.getElementById('bar-leads');
    const barCustomers = document.getElementById('bar-customers');

    // Chart containers
    const yAxis = document.getElementById('y-axis');
    const xAxis = document.getElementById('x-axis');
    const gridLines = document.getElementById('grid-lines');
    const barsContainer = document.getElementById('bars-container');
    const tooltip = document.getElementById('chart-tooltip');
    
    function parseDate(dateString) {
        return new Date(dateString);
    }
    
    function calculateMonths(start, end) {
        const d1 = parseDate(start);
        const d2 = parseDate(end);
        
        let months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        
        // Fallback or min boundary
        return months > 0 ? months : 1;
    }

    function generateGridAndLabels(maxVal) {
        // Simple logic to create nice 20-step increments
        const step = 20;
        const tickCount = Math.max(2, Math.ceil(maxVal / step) + 1);
        const calcMax = (tickCount - 1) * step; // Round max for chart rendering limits
        
        // Clear old
        gridLines.innerHTML = '';
        xAxis.innerHTML = '';

        for(let i=0; i<tickCount; i++) {
            const v = i * step;
            const leftPct = (v / calcMax) * 100;
            
            // Grid line
            const line = document.createElement('div');
            line.className = 'grid-line';
            line.style.setProperty('--grid-left', leftPct + '%');
            gridLines.appendChild(line);

            // Label
            const lbl = document.createElement('span');
            lbl.className = 'x-axis-lbl';
            lbl.style.setProperty('--grid-left', leftPct + '%');
            lbl.innerText = v + ' people';
            xAxis.appendChild(lbl);
        }

        return calcMax; // Current logical max for the chart scaling
    }

    function calculateData() {
        const tr = parseFloat(inputRevenue.value) || 0;
        const aov = parseFloat(inputAov.value) || 1;
        const leadRate = parseFloat(sliderLeadRate.value) / 100;
        const prospectRate = parseFloat(sliderProspectRate.value) / 100;

        let customers = tr / aov;
        let leads = customers > 0 && leadRate > 0 ? customers / leadRate : 0;
        let prospects = leads > 0 && prospectRate > 0 ? leads / prospectRate : 0;

        // Ensure rounding for displays
        customers = Math.round(customers);
        leads = Math.round(leads);
        prospects = Math.round(prospects);

        return { customers, leads, prospects };
    }

    function updateCards(data) {
        valProspects.innerText = data.prospects;
        valLeads.innerText = data.leads;
        valCustomers.innerText = data.customers;

        // percentages of prospects
        const pLeads = Math.round((data.prospects > 0 ? (data.leads / data.prospects) : 0) * 100);
        const pCust = Math.round((data.prospects > 0 ? (data.customers / data.prospects) : 0) * 100);

        pctLeads.innerText = `${pLeads}%`;
        pctCustomers.innerText = `${pCust}%`;

        barLeads.style.setProperty('--bar-w', `${pLeads}%`);
        barCustomers.style.setProperty('--bar-w', `${pCust}%`);
    }

    function drawChart(data, months) {
        yAxis.innerHTML = '';
        barsContainer.innerHTML = '';
        
        const chartAxisLabel = document.createElement('span');
        chartAxisLabel.className = 'axis-title';
        chartAxisLabel.innerText = 'Months';
        yAxis.appendChild(chartAxisLabel);

        const currentChartMax = generateGridAndLabels(data.prospects);

        for(let i=1; i<=months; i++) {
            // Y-axis label
            const l = document.createElement('div');
            l.className = 'y-axis-lbl';
            l.innerText = i + '-';
            yAxis.appendChild(l);

            // Interpolated values for current month (linear growth)
            const factor = i / months;
            const cP = Math.round(data.prospects * factor);
            const cL = Math.round(data.leads * factor);
            const cC = Math.round(data.customers * factor);

            const wP = currentChartMax === 0 ? 0 : (cP / currentChartMax) * 100;
            const wL = currentChartMax === 0 ? 0 : (cL / currentChartMax) * 100;
            const wC = currentChartMax === 0 ? 0 : (cC / currentChartMax) * 100;

            const group = document.createElement('div');
            group.className = 'bar-group';
            group.style.setProperty('--wp', `${wP}%`);
            group.style.setProperty('--wl', `${wL}%`);
            group.style.setProperty('--wc', `${wC}%`);

            group.innerHTML = `
                <div class="bar bar-p"></div>
                <div class="bar bar-l"></div>
                <div class="bar bar-c"></div>
            `;

            // Hover tooltip logic
            group.addEventListener('mouseenter', (e) => {
                const rect = group.getBoundingClientRect();
                const parentRect = barsContainer.getBoundingClientRect();
                
                tooltip.classList.add('visible');
                tooltip.style.setProperty('--tt-top', (rect.top - parentRect.top + 20) + 'px');
                tooltip.style.setProperty('--tt-left', (rect.width * (wP/100) + 15) + 'px'); // approximate position near end of prospects bar

                document.getElementById('tt-month').innerText = `Month #${i}`;
                document.getElementById('tt-stats').innerHTML = `
                    Prospects: ${cP}<br>
                    Leads: ${cL}<br>
                    Customers: ${cC}
                `;
            });

            group.addEventListener('mousemove', (e) => {
                const parentRect = barsContainer.getBoundingClientRect();
                tooltip.style.setProperty('--tt-left', (e.clientX - parentRect.left + 15) + 'px');
                tooltip.style.setProperty('--tt-top', (e.clientY - parentRect.top - 20) + 'px');
            });

            group.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });

            barsContainer.appendChild(group);
        }
    }

    function render() {
        valLeadRate.innerText = parseFloat(sliderLeadRate.value).toFixed(2) + '%';
        valProspectRate.innerText = parseFloat(sliderProspectRate.value).toFixed(2) + '%';
        
        let monthsCount = calculateMonths(inputStartDate.value, inputEndDate.value);
        if (monthsCount < 6) monthsCount = 6; // Force at least 6 months based on the image constraints

        const data = calculateData();
        updateCards(data);
        drawChart(data, monthsCount);
    }

    // Attach listeners
    [inputStartDate, inputEndDate, inputRevenue, inputAov, sliderLeadRate, sliderProspectRate].forEach(el => {
        el.addEventListener('input', render);
    });

    // Initial render
    render();
});