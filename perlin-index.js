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

function _f32ArrayToHeapPtr(fArray) {
	const typedArray = new Float32Array(fArray);
	const bufferPtr = Module._malloc(typedArray.length * typedArray.BYTES_PER_ELEMENT);
	Module.HEAPF32.set(typedArray, bufferPtr >> 2);
	return bufferPtr;
}

/**
 * frees a typed array previously build by _arrayToHeap
 * @param heapBytes {Uint8Array} 
 */
function _freeArray(heapBytes){
	Module._free(heapBytes.byteOffset);
}


function createFunctions() {
	return {
		generatePerlinNoise: function(aNoise) {
			let inputHeapPtr;
			let outputHeapPtr;
			let output = [];
			const nLength = Math.sqrt(aNoise.length);
			inputHeapPtr = _f32ArrayToHeapPtr(aNoise);
			outputHeapPtr = Module.ccall('generatePerlinNoise', 'number', ['number', 'number'], [inputHeapPtr, nLength]);
			nBasePtr = outputHeapPtr >> 2;
			const n2 = nLength * nLength;
			for (let v = 0; v < n2; ++v) {
				output[v] = Module.HEAPF32[nBasePtr + v];
			}
			Module._free(inputHeapPtr);
			Module._free(outputHeapPtr);
			return output;
		}
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

function buildCanvas(aData) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = aData.length;
	const context = canvas.getContext('2d');
	aData.forEach((row, y) => row.forEach((cell, x) => {
		const nComp = cell * 255 | 0;
		context.fillStyle = 'rgb(' + [nComp, nComp, nComp].join(',') + ')';
		context.fillRect(x, y, 1, 1);
	}));
	return canvas;
}

function buildCanvas1d(aData, nLength) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = Math.sqrt(aData.length);
	const context = canvas.getContext('2d');
	aData.forEach((cell, i) => {
		const y = Math.floor(i / nLength);
		const x = i % nLength;		
		const nComp = cell * 255 | 0;
		context.fillStyle = 'rgb(' + [nComp, nComp, nComp].join(',') + ')';
		context.fillRect(x, y, 1, 1);
	});
	return canvas;
}


function benchMark(f, n) {
	let t = 0;
	for (let x = 0; x < n; ++x) {
		const t1 = performance.now();
		f();
		t += performance.now() - t1;
	}
	return t / n;
}


function runTests() {
	let a, b;

	const aInput = create2DArray(256, (x, y) => Math.random());
	const t_moy1 = benchMark(() => {
		a = Perlin.generate(aInput, 8);
	}, 100);
	console.log('temps moyen perlin normal', t_moy1);

	const wasmPerlin = createFunctions();
	const aInput2 = (new Array(256 * 256)).fill(0).map(x => Math.random());
	const t_moy2 = benchMark(() => {
		b = wasmPerlin.generatePerlinNoise(aInput2);
	}, 100);
	console.log('temps moyen perlin wasm', t_moy2);
//	document.body.appendChild(buildCanvas(a));
//	document.body.appendChild(buildCanvas1d(b, 256));
}
