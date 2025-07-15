// Component Loader for GitHub Pages - Embedded Components
class ComponentLoader {
    constructor() {
        this.components = {
            header: this.getHeaderHTML(),
            footer: `
                <!-- Footer -->
                <footer class="footer" id="contact">
                    <div class="container">
                        <div class="footer-content">
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

    getHeaderHTML() {
        // Determine if we're in a subdirectory (tools folder)
        const isInTools = window.location.pathname.includes('/tools/');
        const basePath = isInTools ? '../' : '';
        
        return `
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
                                <li><a href="${basePath}index.html" class="nav-link">Home</a></li>
                                <li><a href="${basePath}blog.html" class="nav-link">Blog</a></li>
                                <li class="dropdown">
                                    <a href="#" class="nav-link dropdown-toggle">Tools</a>
                                    <ul class="dropdown-menu">
                                        <li class="dropdown-submenu">
                                            <a href="#" class="dropdown-toggle">Finance</a>
                                            <ul class="dropdown-submenu-menu">
                                                <li><a href="${basePath}tools/fire-calculator.html">FIRE Calculator</a></li>
                                            </ul>
                                        </li>
                                        <li class="dropdown-submenu">
                                            <a href="#" class="dropdown-toggle">Fun</a>
                                            <ul class="dropdown-submenu-menu">
                                                <li><a href="${basePath}tools/timeline-generator.html">Timeline Generator</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                                <li><a href="${basePath}resume.html" class="nav-link">Resume</a></li>
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
        `;
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
            // Mobile menu toggle
            mobileMenuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                navList.classList.toggle('active');
                mobileMenuToggle.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!navList.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    navList.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            });

            // Close mobile menu when clicking on a link
            const navLinks = navList.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    navList.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                });
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
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            let isActive = false;
            
            // Handle home page
            if (currentPage === 'index.html' || currentPath === '/' || currentPath.endsWith('/')) {
                isActive = href === 'index.html' || href.endsWith('index.html');
            }
            // Handle other pages
            else if (href === currentPage) {
                isActive = true;
            }
            // Handle tools pages
            else if (currentPath.includes('tools/') && href.includes('tools/')) {
                isActive = true;
            }
            
            if (isActive) {
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