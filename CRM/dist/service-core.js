// Pure event detection, shared by the browser and the alert regression tests.
globalThis.ServiceAlertCore = {
  detect(snapshot, role, seen, initialized) {
    const kitchen = ['Owner','Manager','Kitchen'].includes(role);
    const floor = ['Owner','Manager','Cashier','Host','Floor Staff'].includes(role);
    const events = [];
    for (const order of snapshot.orders || []) {
      const newKey = `new:${order.id}:${order.sentAt || order.createdAt}`;
      if (kitchen) {
        if (initialized && !seen.has(newKey) && ['Kitchen','Preparing'].includes(order.status)) events.push({kind:'new',order});
        seen.add(newKey);
      }
      if (floor && order.status === 'Ready') {
        const readyKey = `ready:${order.id}:${order.readyAt || order.sentAt}`;
        if (initialized && !seen.has(readyKey)) events.push({kind:'ready',order});
        seen.add(readyKey);
      }
      if (order.delayed && ((kitchen && order.status !== 'Ready') || (floor && order.status === 'Ready'))) {
        const key = `delay:${order.id}:${order.status === 'Ready' ? 'service' : 'kitchen'}:${order.readyAt || order.sentAt}`;
        if (initialized && !seen.has(key)) events.push({kind:'delay',order});
        seen.add(key);
      }
    }
    while (seen.size > 500) seen.delete(seen.values().next().value);
    return events;
  },
};
