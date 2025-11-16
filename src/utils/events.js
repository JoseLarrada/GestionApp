// Sistema de eventos para refresco automático
class AppEvents {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback());
  }

  // Eventos de productos
  onProductsChanged() {
    this.emit('products:changed');
  }

  onProvidersChanged() {
    this.emit('providers:changed');
  }

  onCategoriesChanged() {
    this.emit('categories:changed');
  }

  // Eventos de caja
  onExpensesChanged() {
    this.emit('expenses:changed');
  }

  onTransportadorasChanged() {
    this.emit('transportadoras:changed');
  }

  // Eventos de transferencias
  onTransfersChanged() {
    this.emit('transfers:changed');
  }

  onDomiciliariosChanged() {
    this.emit('domiciliarios:changed');
  }

  onBaseChanged() {
    this.emit('base:changed');
  }

  // Evento general para dashboard
  onDataChanged() {
    this.emit('dashboard:refresh');
    this.emit('products:changed');
    this.emit('expenses:changed');
    this.emit('transfers:changed');
  }
}

export const appEvents = new AppEvents();
