/**
 * LaundryOS — Main Application
 * Single Page Application with vanilla JS
 */
(() => {
    const app = document.getElementById('app');
    let garmentsList = [];
    let currentPage = 'dashboard';
    let ordersPage = 1;
    let ordersFilters = {};

    // ─── Toast Notifications ──────────────────────────────────
    const toast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 300);
        }, 3000);
    };

    // ─── Icons (inline SVGs) ─────────────────────────────────
    const icons = {
        dashboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
        orders: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        close: '×',
        remove: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
        arrow: '→',
        laundry: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12" y2="6.01"/><line x1="8" y1="6" x2="8" y2="6.01"/></svg>',
    };

    // ─── Render Auth Page ─────────────────────────────────────
    const renderAuth = (mode = 'login') => {
        const isLogin = mode === 'login';
        app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card fade-in">
          <div style="text-align:center; margin-bottom: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🧺</div>
            <h1 class="auth-title">${isLogin ? 'Welcome back' : 'Create account'}</h1>
            <p class="auth-subtitle">${isLogin ? 'Sign in to manage your laundry orders' : 'Register to get started with LaundryOS'}</p>
          </div>
          <form id="auth-form">
            ${!isLogin ? `
              <div class="form-group">
                <label class="form-label">Name</label>
                <input class="form-input" id="auth-name" type="text" placeholder="John Doe" required minlength="2">
              </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="auth-email" type="email" placeholder="you@store.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" id="auth-password" type="password" placeholder="••••••••" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary btn-full" id="auth-submit" style="margin-top: 0.5rem; padding: 12px;">
              ${isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <div class="auth-footer">
            ${isLogin
                ? ''
                : 'Already have an account? <a href="#" id="switch-auth">Sign in</a>'}
          </div>
        </div>
      </div>
    `;

        if (isLogin) {
            const footer = document.querySelector('.auth-footer');
            footer.innerHTML = 'Please sign in to continue.';
        } else {
            document.getElementById('switch-auth').addEventListener('click', (e) => {
                e.preventDefault();
                renderAuth('login');
            });
        }

        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('auth-submit');
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0 auto;"></div>';

            try {
                const body = {
                    email: document.getElementById('auth-email').value,
                    password: document.getElementById('auth-password').value,
                };
                
                const res = await API.login(body);
                API.setToken(res.data.token);
                API.setUser(res.data.user);
                toast('Welcome back!');
                init();
            } catch (err) {
                toast(err.message || 'Authentication failed', 'error');
                btn.disabled = false;
                btn.textContent = 'Sign in';
            }
        });
    };

    // ─── Render App Shell ─────────────────────────────────────
    const renderShell = () => {
        const user = API.getUser();
        app.innerHTML = `
      <nav class="navbar">
        <a class="navbar-brand" href="#">
          🧺 LaundryOS
        </a>
        <ul class="navbar-nav" id="main-nav">
          <li><button class="nav-link active" data-page="dashboard">${icons.dashboard} <span>Dashboard</span></button></li>
          <li><button class="nav-link" data-page="orders">${icons.orders} <span>Orders</span></button></li>
        </ul>
        <div class="navbar-user">
          <span class="user-name">${user?.name || 'User'}</span>
          <button class="btn-logout" id="btn-logout">Logout</button>
        </div>
      </nav>
      <main class="main-content" id="page-content"></main>
    `;

        // Nav events
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                currentPage = link.dataset.page;
                renderPage();
            });
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            API.removeToken();
            API.removeUser();
            toast('Logged out');
            renderAuth();
        });
    };

    // ─── Page Router ──────────────────────────────────────────
    const renderPage = () => {
        if (currentPage === 'dashboard') renderDashboard();
        else if (currentPage === 'orders') renderOrders();
    };

    // ─── Dashboard ────────────────────────────────────────────
    const renderDashboard = async () => {
        const content = document.getElementById('page-content');
        content.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

        try {
            const res = await API.getDashboard();
            const d = res.data;

            content.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1 class="page-title">Dashboard</h1>
              <p class="page-subtitle">Overview of your laundry operations</p>
            </div>
            <button class="btn btn-primary" id="btn-new-order">${icons.plus} New Order</button>
          </div>

          <div class="stats-grid">
            <div class="card">
              <div class="card-header">
                <span class="card-title">Total Orders</span>
                <div class="stat-icon blue">📦</div>
              </div>
              <div class="card-value">${d.totalOrders}</div>
              <div class="card-subtext">All time</div>
            </div>
            <div class="card">
              <div class="card-header">
                <span class="card-title">Revenue</span>
                <div class="stat-icon green">💰</div>
              </div>
              <div class="card-value">₹${d.totalRevenue.toLocaleString()}</div>
              <div class="card-subtext">Avg ₹${d.averageOrderValue}/order</div>
            </div>
            <div class="card">
              <div class="card-header">
                <span class="card-title">Active</span>
                <div class="stat-icon amber">⏳</div>
              </div>
              <div class="card-value">${d.ordersByStatus.RECEIVED + d.ordersByStatus.PROCESSING}</div>
              <div class="card-subtext">${d.ordersByStatus.READY} ready for pickup</div>
            </div>
            <div class="card">
              <div class="card-header">
                <span class="card-title">Delivered</span>
                <div class="stat-icon red">✅</div>
              </div>
              <div class="card-value">${d.ordersByStatus.DELIVERED}</div>
              <div class="card-subtext">Completed orders</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <!-- Status Breakdown -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Orders by Status</span>
              </div>
              <div style="display:flex; flex-direction:column; gap: 12px; margin-top: 8px;">
                ${renderStatusBar('Received', d.ordersByStatus.RECEIVED, d.totalOrders, 'received')}
                ${renderStatusBar('Processing', d.ordersByStatus.PROCESSING, d.totalOrders, 'processing')}
                ${renderStatusBar('Ready', d.ordersByStatus.READY, d.totalOrders, 'ready')}
                ${renderStatusBar('Delivered', d.ordersByStatus.DELIVERED, d.totalOrders, 'delivered')}
              </div>
            </div>

            <!-- Recent Orders -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Recent Orders</span>
              </div>
              ${d.recentOrders.length === 0
                    ? '<div class="empty-state"><p>No orders yet</p></div>'
                    : `<div style="display:flex; flex-direction:column; gap: 8px; margin-top: 8px;">
                    ${d.recentOrders.map(o => `
                      <div style="display:flex; align-items:center; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-100); cursor:pointer;" onclick="window.__viewOrder('${o.orderId}')">
                        <div>
                          <span class="order-id">${o.orderId}</span>
                          <div style="font-size:0.8rem; color:var(--gray-400);">${o.customerName}</div>
                        </div>
                        <div style="text-align:right;">
                          <span class="badge badge-${o.status.toLowerCase()}">${o.status}</span>
                          <div class="amount" style="font-size:0.8rem; margin-top:4px;">₹${o.totalAmount}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>`
                }
            </div>
          </div>

          ${d.topGarments.length > 0 ? `
          <div class="card mt-lg">
            <div class="card-header">
              <span class="card-title">Top Garments</span>
            </div>
            <div class="table-container" style="border: none;">
              <table>
                <thead>
                  <tr>
                    <th>Garment Type</th>
                    <th>Total Quantity</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  ${d.topGarments.map(g => `
                    <tr>
                      <td>${g._id}</td>
                      <td>${g.totalQuantity}</td>
                      <td class="amount">₹${g.totalRevenue.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}
        </div>
      `;

            document.getElementById('btn-new-order').addEventListener('click', openCreateOrderModal);
        } catch (err) {
            content.innerHTML = `<div class="empty-state"><p>Failed to load dashboard: ${err.message}</p></div>`;
        }
    };

    const renderStatusBar = (label, count, total, type) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
      <div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="font-size:0.8rem; font-weight:500; color:var(--gray-600);">${label}</span>
          <span style="font-size:0.8rem; font-weight:600; color:var(--gray-800);">${count}</span>
        </div>
        <div style="height:6px; background:var(--gray-100); border-radius:3px; overflow:hidden;">
          <div class="badge-${type}" style="height:100%; width:${pct}%; border-radius:3px; transition: width 600ms ease;"></div>
        </div>
      </div>
    `;
    };

    // ─── Orders List ──────────────────────────────────────────
    const renderOrders = async () => {
        const content = document.getElementById('page-content');
        content.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

        try {
            const res = await API.getOrders({ ...ordersFilters, page: ordersPage, limit: 15 });
            const { orders, pagination } = res.data;

            content.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1 class="page-title">Orders</h1>
              <p class="page-subtitle">${pagination.total} total orders</p>
            </div>
            <button class="btn btn-primary" id="btn-new-order2">${icons.plus} New Order</button>
          </div>

          <div class="filters-bar">
            <select class="form-select" id="filter-status">
              <option value="">All Statuses</option>
              <option value="RECEIVED" ${ordersFilters.status === 'RECEIVED' ? 'selected' : ''}>Received</option>
              <option value="PROCESSING" ${ordersFilters.status === 'PROCESSING' ? 'selected' : ''}>Processing</option>
              <option value="READY" ${ordersFilters.status === 'READY' ? 'selected' : ''}>Ready</option>
              <option value="DELIVERED" ${ordersFilters.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
            </select>
            <input class="form-input" id="filter-customer" type="text" placeholder="Search customer..." value="${ordersFilters.customer || ''}">
            <input class="form-input" id="filter-phone" type="text" placeholder="Search phone..." value="${ordersFilters.phone || ''}">
            <input class="form-input" id="filter-garment" type="text" placeholder="Search garment..." value="${ordersFilters.garmentType || ''}">
            <button class="btn btn-secondary btn-sm" id="btn-clear-filters">Clear</button>
          </div>

          ${orders.length === 0
                    ? '<div class="empty-state"><p>No orders found matching your filters</p></div>'
                    : `
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Garments</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.map(o => `
                      <tr style="cursor:pointer;" onclick="window.__viewOrder('${o.orderId}')">
                        <td><span class="order-id">${o.orderId}</span></td>
                        <td>
                          ${o.customerName}
                          <div class="customer-phone">${o.phoneNumber}</div>
                        </td>
                        <td style="font-size:0.8rem;">${o.garments.map(g => `${g.quantity}× ${g.garmentType}`).join(', ')}</td>
                        <td><span class="amount">₹${o.totalAmount.toLocaleString()}</span></td>
                        <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
                        <td style="font-size:0.8rem; color:var(--gray-400);">${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td>
                          ${o.status !== 'DELIVERED' ? `<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); window.__advanceStatus('${o.orderId}', '${o.status}')">Advance →</button>` : ''}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              ${pagination.totalPages > 1 ? `
                <div class="pagination">
                  <button ${ordersPage <= 1 ? 'disabled' : ''} onclick="window.__setOrdersPage(${ordersPage - 1})">← Prev</button>
                  <span class="pagination-info">Page ${pagination.page} of ${pagination.totalPages}</span>
                  <button ${ordersPage >= pagination.totalPages ? 'disabled' : ''} onclick="window.__setOrdersPage(${ordersPage + 1})">Next →</button>
                </div>
              ` : ''}
            `
                }
        </div>
      `;

            // Attach filter events
            document.getElementById('btn-new-order2').addEventListener('click', openCreateOrderModal);

            let filterTimeout;
            const applyFilters = () => {
                clearTimeout(filterTimeout);
                filterTimeout = setTimeout(() => {
                    ordersFilters = {
                        status: document.getElementById('filter-status').value,
                        customer: document.getElementById('filter-customer').value,
                        phone: document.getElementById('filter-phone').value,
                        garmentType: document.getElementById('filter-garment').value,
                    };
                    // Remove empty filters
                    Object.keys(ordersFilters).forEach(k => { if (!ordersFilters[k]) delete ordersFilters[k]; });
                    ordersPage = 1;
                    renderOrders();
                }, 400);
            };

            document.getElementById('filter-status').addEventListener('change', applyFilters);
            document.getElementById('filter-customer').addEventListener('input', applyFilters);
            document.getElementById('filter-phone').addEventListener('input', applyFilters);
            document.getElementById('filter-garment').addEventListener('input', applyFilters);
            document.getElementById('btn-clear-filters').addEventListener('click', () => {
                ordersFilters = {};
                ordersPage = 1;
                renderOrders();
            });
        } catch (err) {
            content.innerHTML = `<div class="empty-state"><p>Failed to load orders: ${err.message}</p></div>`;
        }
    };

    // ─── Create Order Modal ───────────────────────────────────
    const openCreateOrderModal = async () => {
        // Ensure garments list is loaded
        if (garmentsList.length === 0) {
            try {
                const res = await API.getGarments();
                garmentsList = res.data.garments;
            } catch (e) {
                toast('Failed to load garment prices', 'error');
                return;
            }
        }

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">New Order</h2>
          <button class="modal-close" id="modal-close">${icons.close}</button>
        </div>
        <div class="modal-body">
          <form id="create-order-form">
            <div class="form-group">
              <label class="form-label">Customer Name</label>
              <input class="form-input" id="co-name" type="text" placeholder="Enter customer name" required minlength="2">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input class="form-input" id="co-phone" type="tel" placeholder="10-digit number" required pattern="[6-9][0-9]{9}">
            </div>
            <div class="form-group">
              <label class="form-label">Garments</label>
              <div id="garments-list">
                ${renderGarmentRow(0)}
              </div>
              <button type="button" class="add-garment-btn" id="btn-add-garment">${icons.plus} Add Garment</button>
            </div>
            <div class="form-group">
              <label class="form-label">Notes (optional)</label>
              <input class="form-input" id="co-notes" type="text" placeholder="Special instructions..." maxlength="500">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top: var(--space-sm); border-top: 1px solid var(--gray-100); margin-top: var(--space-md);">
              <div>
                <span style="font-size:0.8rem; color:var(--gray-400);">Estimated Total</span>
                <div id="order-total" style="font-size:1.3rem; font-weight:700; color:var(--black); font-family: var(--font-mono);">₹0</div>
              </div>
              <button type="submit" class="btn btn-primary" id="btn-submit-order">Create Order</button>
            </div>
          </form>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        // Close modal
        const closeModal = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('#modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        // Add garment row
        let garmentCount = 1;
        overlay.querySelector('#btn-add-garment').addEventListener('click', () => {
            const list = overlay.querySelector('#garments-list');
            const div = document.createElement('div');
            div.innerHTML = renderGarmentRow(garmentCount++);
            list.appendChild(div.firstElementChild);
            updateTotal();
        });

        // Remove garment row & update total (delegated)
        overlay.querySelector('#garments-list').addEventListener('click', (e) => {
            if (e.target.closest('.btn-remove')) {
                const rows = overlay.querySelectorAll('.garment-row');
                if (rows.length > 1) {
                    e.target.closest('.garment-row').remove();
                    updateTotal();
                }
            }
        });

        overlay.querySelector('#garments-list').addEventListener('change', updateTotal);
        overlay.querySelector('#garments-list').addEventListener('input', updateTotal);

        function updateTotal() {
            let total = 0;
            overlay.querySelectorAll('.garment-row').forEach(row => {
                const type = row.querySelector('.garment-select').value;
                const qty = parseInt(row.querySelector('.garment-qty').value) || 0;
                const garment = garmentsList.find(g => g.type === type);
                if (garment) total += garment.price * qty;
            });
            overlay.querySelector('#order-total').textContent = `₹${total.toLocaleString()}`;
        }

        updateTotal();

        // Submit order
        overlay.querySelector('#create-order-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = overlay.querySelector('#btn-submit-order');
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div>';

            const garments = [];
            overlay.querySelectorAll('.garment-row').forEach(row => {
                garments.push({
                    garmentType: row.querySelector('.garment-select').value,
                    quantity: parseInt(row.querySelector('.garment-qty').value) || 1,
                });
            });

            try {
                const res = await API.createOrder({
                    customerName: overlay.querySelector('#co-name').value,
                    phoneNumber: overlay.querySelector('#co-phone').value,
                    garments,
                    notes: overlay.querySelector('#co-notes').value || undefined,
                });

                toast(`Order ${res.data.order.orderId} created! Total: ₹${res.data.order.totalAmount}`);
                closeModal();
                renderPage(); // refresh current page
            } catch (err) {
                const msg = err.errors ? err.errors.map(e => e.message || e).join(', ') : err.message;
                toast(msg || 'Failed to create order', 'error');
                btn.disabled = false;
                btn.textContent = 'Create Order';
            }
        });
    };

    const renderGarmentRow = (index) => {
        return `
      <div class="garment-row">
        <select class="form-select garment-select" required>
          ${garmentsList.map(g => `<option value="${g.type}">${g.type} — ₹${g.price}</option>`).join('')}
        </select>
        <input type="number" class="form-input garment-qty" value="1" min="1" max="100" style="max-width:80px;" required>
        <button type="button" class="btn-remove" title="Remove">${icons.remove}</button>
      </div>
    `;
    };

    // ─── Order Detail Modal ───────────────────────────────────
    const viewOrderDetail = async (orderId) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Order Details</h2>
          <button class="modal-close" id="detail-close">${icons.close}</button>
        </div>
        <div class="modal-body">
          <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        const closeModal = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('#detail-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        try {
            const res = await API.getOrder(orderId);
            const o = res.data.order;

            const statuses = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];
            const currentIdx = statuses.indexOf(o.status);
            const nextStatus = statuses[currentIdx + 1];

            overlay.querySelector('.modal-body').innerHTML = `
        <div class="fade-in">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-md);">
            <span class="order-id" style="font-size:1rem;">${o.orderId}</span>
            <span class="badge badge-${o.status.toLowerCase()}">${o.status}</span>
          </div>

          <div class="status-flow">
            ${statuses.map((s, i) => `
              <span class="status-step ${i < currentIdx ? 'completed' : ''} ${i === currentIdx ? 'current' : ''}">${s}</span>
              ${i < statuses.length - 1 ? `<span class="status-arrow">${icons.arrow}</span>` : ''}
            `).join('')}
          </div>

          <div class="detail-grid mt-md">
            <div class="detail-item">
              <div class="detail-label">Customer</div>
              <div class="detail-value">${o.customerName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Phone</div>
              <div class="detail-value">${o.phoneNumber}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Created</div>
              <div class="detail-value">${new Date(o.createdAt).toLocaleString('en-IN')}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Est. Delivery</div>
              <div class="detail-value">${o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleString('en-IN') : 'N/A'}</div>
            </div>
          </div>

          <div class="mt-md">
            <div class="detail-label mb-md">Garments</div>
            <div class="table-container" style="border:1px solid var(--gray-100);">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${o.garments.map(g => `
                    <tr>
                      <td>${g.garmentType}</td>
                      <td>${g.quantity}</td>
                      <td>₹${g.pricePerItem}</td>
                      <td class="amount">₹${g.subtotal.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                  <tr style="background:var(--gray-50);">
                    <td colspan="3" style="text-align:right; font-weight:600;">Total</td>
                    <td class="amount" style="font-size:1rem;">₹${o.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          ${o.notes ? `
            <div class="mt-md">
              <div class="detail-label">Notes</div>
              <div class="detail-value" style="color:var(--gray-500);">${o.notes}</div>
            </div>
          ` : ''}

          ${nextStatus ? `
            <div class="status-actions mt-md">
              <button class="btn-status next-status" id="btn-advance">
                Move to ${nextStatus} →
              </button>
            </div>
          ` : '<div class="mt-md" style="font-size:0.85rem; color:var(--accent-green); font-weight:500;">✓ Order completed</div>'}
        </div>
      `;

            if (nextStatus) {
                overlay.querySelector('#btn-advance').addEventListener('click', async (e) => {
                    e.target.disabled = true;
                    try {
                        await API.updateStatus(o.orderId, nextStatus);
                        toast(`Order moved to ${nextStatus}`);
                        closeModal();
                        renderPage();
                    } catch (err) {
                        toast(err.message || 'Failed to update status', 'error');
                        e.target.disabled = false;
                    }
                });
            }
        } catch (err) {
            overlay.querySelector('.modal-body').innerHTML = `<div class="empty-state"><p>Failed to load order: ${err.message}</p></div>`;
        }
    };

    // ─── Global Functions (for onclick handlers in HTML) ──────
    window.__viewOrder = (orderId) => viewOrderDetail(orderId);
    window.__setOrdersPage = (page) => { ordersPage = page; renderOrders(); };
    window.__advanceStatus = async (orderId, currentStatus) => {
        const next = { RECEIVED: 'PROCESSING', PROCESSING: 'READY', READY: 'DELIVERED' };
        if (!next[currentStatus]) return;
        try {
            await API.updateStatus(orderId, next[currentStatus]);
            toast(`Order ${orderId} → ${next[currentStatus]}`);
            renderPage();
        } catch (err) {
            toast(err.message || 'Failed to update', 'error');
        }
    };

    // ─── Init ─────────────────────────────────────────────────
    const init = async () => {
        if (!API.isLoggedIn()) {
            renderAuth();
            return;
        }

        // Verify token is still valid
        try {
            await API.getMe();
        } catch (err) {
            API.removeToken();
            API.removeUser();
            renderAuth();
            return;
        }

        // Pre-load garments
        try {
            const res = await API.getGarments();
            garmentsList = res.data.garments;
        } catch (e) { }

        renderShell();
        renderPage();
    };

    init();
})();
