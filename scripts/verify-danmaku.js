/**
 * 手持弹幕 — 边缘进出逻辑验证
 */
function motion(direction, W, T) {
  var leftIn = direction === 'left'
  return leftIn
    ? { from: -T, to: W }
    : { from: W, to: -T }
}

var m1 = motion('left', 300, 80)
var m2 = motion('right', 300, 80)
var ok =
  m1.from === -80 &&
  m1.to === 300 &&
  m2.from === 300 &&
  m2.to === -80

console.log('left:', m1, 'right:', m2)
console.log(ok ? 'PASS edge in/out' : 'FAIL')
process.exit(ok ? 0 : 1)
