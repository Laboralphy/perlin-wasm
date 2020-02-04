#include <math.h>
#include <malloc.h>
#include <stdio.h>


#define PI 3.14159265

/**
 * for a given size, compute the best octave count
 * @param n {int} size (pixel}
 * @returns {int}
 */
int computeOptimalOctaves(n) {
	int i = 10;
	int i2 = 0;
	while (i > 0) {
		i2 = 1 << i;
		if (i2 <= n) {
			break;
		}
		--i;
	}
	return i;
}

/**
 * Cosine Interpolation
 * @param x0 {number} minimum
 * @param x1 {number} maximum
 * @param mu {number} value between 0 and 1
 * @return {number} float, interpolation result
 */
float cosineInterpolate(float x0, float x1, float mu) {
	float mu2 = (1 - cos(mu * PI)) / 2;
	return x0 * (1 - mu2) + x1 * mu2;
}



void generateSmoothNoise(float *aBaseNoise, int nLength, float *aSmoothNoise, int nOctaveCount) {
	int w = nLength;
	int h = nLength;

	int nSamplePeriod = 1 << nOctaveCount;
	float fSampleFreq = 1 / (float)nSamplePeriod;
	int xs0, xs1, ys0, ys1;
	float hBlend, vBlend, fTop, fBottom;
	int x, y;
	int bny0, bny1;
	for (y = 0; y < h; ++y) {
		ys0 = y - (y % nSamplePeriod);
		ys1 = (ys0 + nSamplePeriod) % h;
		hBlend = (float)(y - ys0) * fSampleFreq;
		bny0 = ys0 * nLength;
		bny1 = ys1 * nLength;
		for (x = 0; x < w; ++ x) {
			xs0 = x - (x % nSamplePeriod);
			xs1 = (xs0 + nSamplePeriod) % w;
			vBlend = (x - xs0) * fSampleFreq;
			fTop = cosineInterpolate(aBaseNoise[bny0 + xs0], aBaseNoise[bny1 + xs0], hBlend);
			fBottom = cosineInterpolate(aBaseNoise[bny0 + xs1], aBaseNoise[bny1 + xs1], hBlend);
			aSmoothNoise[y * nLength + x] = cosineInterpolate(fTop, fBottom, vBlend);
		}
	}
}



/**
 *
 * @param aBaseNoise {*} a 2d array of values
 * @returns {[]}
 */
void generatePerlinNoise(float *aBaseNoise, int nLength, float *aPerlinNoise) {
	int nOctaveCount = computeOptimalOctaves(nLength);
	float **aSmoothNoise = (float **)malloc(nOctaveCount * sizeof(float *));
	float fPersist = 0.5;

	for (int i = 0; i < nOctaveCount; ++i) {
		aSmoothNoise[i] = (float *)malloc(nLength * nLength * sizeof(float));
		generateSmoothNoise(aBaseNoise, nLength, aSmoothNoise[i], i);
	}

	float fAmplitude = 1;
	float fTotalAmp = 0;
	int x, y, r;

	for (y = 0; y < nLength; ++y) {
		r = y * nLength;
		for (x = 0; x < nLength; ++x) {
			aPerlinNoise[r + x] = 0;
		}
	}

	float *sno;
	int snoy, pny, row;
	for (int iOctave = nOctaveCount - 1; iOctave >= 0; --iOctave) {
		fAmplitude *= fPersist;
		fTotalAmp += fAmplitude;
		sno = aSmoothNoise[iOctave];
		for (y = 0; y < nLength ; ++y) {
			row = y * nLength;
			for (x = 0; x < nLength; ++x) {
				aPerlinNoise[row + x] += sno[row + x] * fAmplitude;
			}
		} 
	}
	for (y = 0; y < nLength; ++y) {
		pny = y * nLength;
		for (x = 0; x < nLength; ++x) {
			aPerlinNoise[pny + x] /= fTotalAmp;
		}
	}
	for (int i = 0; i < nOctaveCount; ++i) {
		free(aSmoothNoise[i]);
	}
	free(aSmoothNoise);
}
