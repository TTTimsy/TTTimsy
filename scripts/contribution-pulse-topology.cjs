function key(weekIndex, weekday) {
  return `${weekIndex},${weekday}`;
}

function compareRootCandidate(left, right) {
  return right.count - left.count || left.date.localeCompare(right.date);
}

function compareFrontier(left, right) {
  return right.count - left.count || left.date.localeCompare(right.date);
}

function buildContributionTopology(data, { weeks = 53, days = 7 } = {}) {
  const records = [];
  for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
    for (let weekday = 0; weekday < days; weekday += 1) {
      const day = data[weekIndex]?.[weekday] || { date: `padding-${weekIndex}-${weekday}`, count: 0, level: 0 };
      records.push({ ...day, weekIndex, weekday, coordinate: key(weekIndex, weekday) });
    }
  }
  const active = records.filter((day) => day.count > 0);
  const activeByCoordinate = new Map(active.map((day) => [day.coordinate, day]));
  const neighborList = (day) => {
    const neighbors = [];
    for (let weekDelta = -1; weekDelta <= 1; weekDelta += 1) for (let dayDelta = -1; dayDelta <= 1; dayDelta += 1) {
      if (!weekDelta && !dayDelta) continue;
      const neighbor = activeByCoordinate.get(key(day.weekIndex + weekDelta, day.weekday + dayDelta));
      if (neighbor) neighbors.push(neighbor);
    }
    return neighbors.sort(compareFrontier);
  };
  const assigned = new Set();
  const components = [];
  for (const candidate of [...active].sort(compareFrontier)) {
    if (assigned.has(candidate.coordinate)) continue;
    const queue = [candidate];
    const members = [];
    assigned.add(candidate.coordinate);
    while (queue.length) {
      const current = queue.shift();
      members.push(current);
      for (const neighbor of neighborList(current)) if (!assigned.has(neighbor.coordinate)) {
        assigned.add(neighbor.coordinate);
        queue.push(neighbor);
      }
    }
    const root = [...members].sort(compareRootCandidate)[0];
    const depthByCoordinate = new Map([[root.coordinate, 0]]);
    const parentByCoordinate = new Map();
    const traversal = [root];
    for (let index = 0; index < traversal.length; index += 1) {
      const current = traversal[index];
      for (const neighbor of neighborList(current)) if (members.includes(neighbor) && !depthByCoordinate.has(neighbor.coordinate)) {
        depthByCoordinate.set(neighbor.coordinate, depthByCoordinate.get(current.coordinate) + 1);
        parentByCoordinate.set(neighbor.coordinate, current);
        traversal.push(neighbor);
      }
    }
    components.push({ root, members: members.sort(compareFrontier), depthByCoordinate, parentByCoordinate });
  }
  components.sort((left, right) => compareRootCandidate(left.root, right.root));
  const bridges = components.flatMap((component) => [...component.parentByCoordinate.entries()].map(([childCoordinate, from]) => ({ from, to: activeByCoordinate.get(childCoordinate), depth: component.depthByCoordinate.get(childCoordinate) })));
  const distanceByCoordinate = new Map(records.map((record) => [record.coordinate, active.length ? Math.min(...active.map((source) => Math.max(Math.abs(source.weekIndex - record.weekIndex), Math.abs(source.weekday - record.weekday)))) : Infinity]));
  return { components, bridges, distanceByCoordinate };
}

module.exports = { buildContributionTopology, compareRootCandidate };
