// Component Loader for GitHub Pages - Embedded Components
class ComponentLoader {
    constructor() {
        this.components = {
            header: `
                <!-- Header -->
                <header class="header">
                    <div class="container">
                        <div class="header-content">
                            <div class="logo">
                                <div class="logo-icon"></div>
                                <div class="logo-text">
                                    <h1>Prashanth R</h1>
                                    <span>Principal Data Analytics Engineer</span>
                                </div>
                            </div>
                            <nav class="nav">
                                <ul class="nav-list">
                                    <li><a href="index.html" class="nav-link">Home</a></li>
                                    <li><a href="blog.html" class="nav-link">Blog</a></li>
                                    <li><a href="projects.html" class="nav-link">Projects</a></li>
                                    <li><a href="resume.html" class="nav-link">Resume</a></li>
                                </ul>
                                <div class="mobile-menu-toggle">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </nav>
                        </div>
                    </div>
                </header>
            `,
            footer: `
                <!-- Footer -->
                <footer class="footer" id="contact">
                    <div class="container">
                        <div class="footer-content">
                            <div class="footer-section">
                                <h4>Phone</h4>
                                <p>+1 (555) 123-4567</p>
                            </div>
                            <div class="footer-section">
                                <h4>Email</h4>
                                <p>prashanth@example.com</p>
                            </div>
                            <div class="footer-section">
                                <h4>Follow Me</h4>
                                <div class="social-links">
                                    <a href="https://linkedin.com/in/prashanth-r" target="_blank" aria-label="LinkedIn">
                                        <i class="fab fa-linkedin"></i>
                                    </a>
                                    <a href="https://github.com/pkracha" target="_blank" aria-label="GitHub">
                                        <i class="fab fa-github"></i>
                                    </a>
                                </div>
                            </div>
                            <div class="footer-section">
                                <p>&copy; 2024 By Prashanth R.</p>
                                <p>Powered by GitHub Pages</p>
                            </div>
                        </div>
                    </div>
                </footer>
            `
        };
    }

    // Load a component by name
    loadComponent(name, selector) {
        const html = this.components[name];
        if (html) {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = html;
                this.initializeComponent(name);
            }
        } else {
            console.error(`Component not found: ${name}`);
        }
    }

    // Initialize component-specific functionality
    initializeComponent(name) {
        switch (name) {
            case 'header':
                this.initializeHeader();
                break;
            case 'footer':
                this.initializeFooter();
                break;
        }
    }

    // Initialize header functionality
    initializeHeader() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navList = document.querySelector('.nav-list');
        
        if (mobileMenuToggle && navList) {
            mobileMenuToggle.addEventListener('click', function() {
                navList.classList.toggle('active');
                mobileMenuToggle.classList.toggle('active');
            });
        }

        // Set active navigation based on current page
        this.setActiveNavigation();
    }

    // Initialize footer functionality
    initializeFooter() {
        // Footer-specific functionality can be added here
    }

    // Set active navigation based on current page
    setActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Load all components
    loadAll() {
        this.loadComponent('header', '#header-placeholder');
        this.loadComponent('footer', '#footer-placeholder');
    }
}

// Initialize component loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.componentLoader = new ComponentLoader();
    
    // Load components if placeholders exist
    if (document.querySelector('#header-placeholder') || document.querySelector('#footer-placeholder')) {
        window.componentLoader.loadAll();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
} 