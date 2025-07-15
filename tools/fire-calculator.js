// FIRE Calculator JavaScript
class FIRECalculator {
    constructor() {
        this.chart = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateFIRE());
        }

        // Auto-calculate on input changes
        const inputs = document.querySelectorAll('.calculator-input input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.calculateFIRE());
        });
    }

    calculateFIRE() {
        const currentAge = parseFloat(document.getElementById('current-age').value);
        const currentSavings = parseFloat(document.getElementById('current-savings').value);
        const annualIncome = parseFloat(document.getElementById('annual-income').value);
        const annualExpenses = parseFloat(document.getElementById('annual-expenses').value);
        const savingsRate = parseFloat(document.getElementById('savings-rate').value) / 100;
        const investmentReturn = parseFloat(document.getElementById('investment-return').value) / 100;
        const withdrawalRate = parseFloat(document.getElementById('withdrawal-rate').value) / 100;

        // Calculate FIRE number (annual expenses / withdrawal rate)
        const fireNumber = annualExpenses / withdrawalRate;

        // Calculate annual savings
        const annualSavings = annualIncome * savingsRate;

        // Calculate years to FIRE using the FIRE formula
        const yearsToFIRE = this.calculateYearsToFIRE(currentSavings, annualSavings, fireNumber, investmentReturn);

        // Calculate FIRE age
        const fireAge = currentAge + yearsToFIRE;

        // Calculate monthly investment needed
        const monthlyInvestment = annualSavings / 12;

        // Update results
        this.updateResults(fireNumber, yearsToFIRE, fireAge, monthlyInvestment);

        // Update chart
        this.updateChart(currentAge, currentSavings, annualSavings, fireNumber, investmentReturn, yearsToFIRE);

        // Get AI insights
        this.getAIInsights(currentAge, fireAge, yearsToFIRE, fireNumber, savingsRate);
    }

    calculateYearsToFIRE(currentSavings, annualSavings, fireNumber, investmentReturn) {
        if (currentSavings >= fireNumber) return 0;
        if (annualSavings <= 0) return Infinity;

        // Using the FIRE formula: years = ln((FIRE_number - current_savings) / annual_savings + 1) / ln(1 + investment_return)
        const numerator = (fireNumber - currentSavings) / annualSavings + 1;
        const years = Math.log(numerator) / Math.log(1 + investmentReturn);
        
        return Math.max(0, years);
    }

    updateResults(fireNumber, yearsToFIRE, fireAge, monthlyInvestment) {
        document.getElementById('fire-number').textContent = this.formatCurrency(fireNumber);
        document.getElementById('years-to-fire').textContent = yearsToFIRE.toFixed(1);
        document.getElementById('fire-age').textContent = fireAge.toFixed(1);
        document.getElementById('monthly-investment').textContent = this.formatCurrency(monthlyInvestment);
    }

    updateChart(currentAge, currentSavings, annualSavings, fireNumber, investmentReturn, yearsToFIRE) {
        const ctx = document.getElementById('fire-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Generate data points
        const dataPoints = [];
        const labels = [];
        let currentAmount = currentSavings;

        for (let year = 0; year <= Math.min(yearsToFIRE + 5, 50); year++) {
            labels.push(currentAge + year);
            dataPoints.push(currentAmount);
            
            if (currentAmount < fireNumber) {
                currentAmount = (currentAmount + annualSavings) * (1 + investmentReturn);
            }
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: dataPoints,
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'FIRE Number',
                    data: Array(labels.length).fill(fireNumber),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Your FIRE Journey'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000) + 'k';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    }
                }
            }
        });
    }

    async getAIInsights(currentAge, fireAge, yearsToFIRE, fireNumber, savingsRate) {
        const insightsDiv = document.getElementById('ai-insights');
        const insightsContent = insightsDiv.querySelector('.insights-content');
        
        // Show loading
        insightsContent.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating AI insights...</p>';

        try {
            // Using a free AI API (Hugging Face Inference API)
            const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer hf_demo', // This is a demo token
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: `Based on the following FIRE calculation results, provide 3 actionable insights for financial independence:
                    - Current Age: ${currentAge}
                    - FIRE Age: ${fireAge.toFixed(1)}
                    - Years to FIRE: ${yearsToFIRE.toFixed(1)}
                    - FIRE Number: $${this.formatCurrency(fireNumber)}
                    - Savings Rate: ${(savingsRate * 100).toFixed(1)}%
                    
                    Provide practical advice in a friendly, encouraging tone.`
                })
            });

            if (response.ok) {
                const data = await response.json();
                const insights = this.parseAIResponse(data);
                insightsContent.innerHTML = `<p>${insights}</p>`;
            } else {
                // Fallback to local insights if API fails
                insightsContent.innerHTML = this.getLocalInsights(currentAge, fireAge, yearsToFIRE, fireNumber, savingsRate);
            }
        } catch (error) {
            console.error('AI API error:', error);
            // Fallback to local insights
            insightsContent.innerHTML = this.getLocalInsights(currentAge, fireAge, yearsToFIRE, fireNumber, savingsRate);
        }
    }

    getLocalInsights(currentAge, fireAge, yearsToFIRE, fireNumber, savingsRate) {
        const insights = [];
        
        if (yearsToFIRE <= 10) {
            insights.push("🎉 <strong>Excellent progress!</strong> You're on track for early retirement. Consider increasing your savings rate to reach FIRE even sooner.");
        } else if (yearsToFIRE <= 20) {
            insights.push("📈 <strong>Good momentum!</strong> You're making solid progress. Focus on increasing your income or reducing expenses to accelerate your timeline.");
        } else {
            insights.push("🚀 <strong>Great start!</strong> Every journey begins with a single step. Consider ways to increase your savings rate or investment returns.");
        }

        if (savingsRate < 0.5) {
            insights.push("💰 <strong>Savings opportunity:</strong> Try to increase your savings rate to 50% or higher. This can dramatically reduce your time to FIRE.");
        }

        if (fireAge < 45) {
            insights.push("⚡ <strong>Early retirement potential:</strong> You could retire in your 40s! Focus on building multiple income streams and optimizing your investments.");
        }

        return insights.map(insight => `<p>${insight}</p>`).join('');
    }

    parseAIResponse(data) {
        // Simple parsing for demo purposes
        if (data && data[0] && data[0].generated_text) {
            return data[0].generated_text;
        }
        return "AI insights are currently unavailable. Please try again later.";
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new FIRECalculator();
}); 