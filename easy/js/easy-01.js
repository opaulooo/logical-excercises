const array = [1, 2, 3, 4, 5];
const target = 4;
const response = [];
const values = [];

for (let i = 0; i < array.length; i++) {
  for (let j = 0; j < array.length; j++) {
    if (array[i] + array[j] === target) {
      response.push(i + "+" + j);
      values.push(array[i] + "+" + array[j]);
    }
  }
}

console.log("==========================");
console.log("Array: ", array);
console.log("Target: ", target);
console.log("Posicoes:", response);
console.log("Valores:", values);
console.log("==========================");

