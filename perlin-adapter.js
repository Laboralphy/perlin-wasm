/**
 * Creates a new typed array filled with values taken from a regular js array of number
 * @param typedArray {number[]}
 * @return {Uint8Array}
 */
function _arrayToHeap(typedArray){
	const numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
	const ptr = Module._malloc(numBytes);
	const heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
	heapBytes.set(new Uint8Array(typedArray.buffer));
	return heapBytes;
}

/**
 * frees a typed array previously build by _arrayToHeap
 * @param heapBytes {Uint8Array} 
 */
function _freeArray(heapBytes){
	Module._free(heapBytes.byteOffset);
}

function createFunctions() {
	return function generatePerlinNoise(aNoise) {
		const nLength = aNoise.length;
		const inputArray = aNoise.reduce((prev, curr) => prev.concat(curr), []);
		const outputArray = (new Array(nLength)).fill(0);
		const inputHeapBytes = _arrayToHeap(new Float32Array(inputArray));
		const outputHeapBytes = _arrayToHeap(new Float32Array(outputArray));
		const ret = Module.ccall('generatePerlinNoise', 'number',['number', 'number', 'number'], [inputHeapBytes.byteOffset, nLength, outputHeapBytes.byteOffset]);
		const aOutputLinear = [...outputHeapBytes];
		_freeArray(inputHeapBytes);
		_freeArray(outputHeapBytes);
		
		const chunks = [];
		for (let i = 0, j = aOutputLinear.length; i < j; i += nLength) {
			chunks.push(aOutputLinear.slice(i, i + chunkCount)); 
		}

		return chunks;
	};
};




function create2DArray(nLength, cb) {
	const o = [];
	for (let y = 0; y < nLength; ++y) {
		const r = [];
		for (let x = 0; x < nLength; ++x) {
			r.push(cb(x, y));
		}
		o.push(r);
	}
	return o;
}


function runTests() {
	let a, b;
	const aInput = create2DArray(256, (x, y) => Math.random());
	console.time('Perlin normal');
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	Perlin.generate(aInput, 8);
	a = Perlin.generate(aInput, 8);
	console.timeEnd('Perlin normal');
	const wasmPerlin = createFunctions();
	console.time('Perlin asm')
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	wasmPerlin(aInput);
	b = wasmPerlin(aInput);
	console.timeEnd('Perlin asm')
}



