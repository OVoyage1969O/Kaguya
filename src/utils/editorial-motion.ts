/** Sampled from onetake wordRise (critical damping, omega 16, 0.8s).
 * Source: Patrick / github.com/feitangyuan, onetake, PolyForm Noncommercial 1.0.0.
 * Samples keep the authored landing curve without shipping the film renderer.
 */
const landing = [
  [0, 22], [.2868, 17.793], [.7126, 11.548], [1, 6.786],
  [1, 3.766], [1, 2.015], [1, 1.05], [1, .537], [1, .271],
  [1, .135], [1, .066], [1, .032], [1, .016], [1, .008],
  [1, .004], [1, .002], [1, 0],
];

export function riseIntoPlace(element: HTMLElement, delay = 0, distance = 22) {
  return element.animate(landing.map(([opacity, y], i) => ({
    offset: i / (landing.length - 1),
    opacity,
    transform: `translateY(${y * distance / 22}px)`,
  })), { duration: 800, delay, easing: "linear", fill: "backwards" });
}
