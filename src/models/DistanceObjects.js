import pool from "./db.js";
import DistanceObject from "./DistanceObject.js";

const distanceTransform = {
  objectSourceIndex: null,
  label: null,
  distanceTo: [],
};

class DistanceObjects {
  #client;

  /**
   * @param {string} predictionId
   * @param {Array<Object>} distanceEach
   * @returns {DistanceObjects}
   */
  transform(predictionId, distanceEachOthers = [distanceTransform]) {
    this.distanceObjects = [];

    distanceEachOthers.forEach((source, i) => {
      source.distanceTo.forEach((destination, j) => {
        const distanceObject = new DistanceObject({
          predictionId,
          objectSourceIndex: source.objectSourceIndex,
          objectTargetIndex: destination.objectDestinationIndex,
          distance: parseFloat(destination.distance),
        });

        this.distanceObjects.push(distanceObject);
      });
    });

    return this;
  }

  async saveAll() {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const colSize = 4;
    const valuesPlaceHolder = this.distanceObjects
      .map(
        (_, index) =>
          `($${index * colSize + 1}, $${index * colSize + 2}, $${
            index * colSize + 3
          }, $${index * colSize + 4})`
      )
      .join(", ");

    const query = `INSERT INTO distance_objects (prediction_id, object_source_index, object_target_index, distance) VALUES ${valuesPlaceHolder}`;

    const values = this.distanceObjects.reduce((acc, distanceObject) => {
      acc.push(distanceObject.predictionId);
      acc.push(distanceObject.objectSourceIndex);
      acc.push(distanceObject.objectTargetIndex);
      acc.push(distanceObject.distance);

      return acc;
    }, []);

    await this.#client.query(query, values);
    await this.#client.release();
  }

  async getAllByPredictionId(predictionId) {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const query = `
      SELECT object_source_index, object_target_index, distance
      FROM distance_objects
      WHERE prediction_id = $1
    `;

    const result = await this.#client.query(query, [predictionId]);

    this.distanceObjects = result.rows.map(
      (row) =>
        new DistanceObject({
          objectSourceIndex: row.object_source_index,
          objectTargetIndex: row.object_target_index,
          distance: row.distance,
        })
    );

    await this.#client.release();
  }

  transformToArr2D() {
    const arr2D = [[]];

    for (let i = 0; i < this.distanceObjects.length; i++) {
      const tmp = this.distanceObjects[i];

      if (!arr2D[tmp.objectSourceIndex]) {
        arr2D[tmp.objectSourceIndex] = [];
      }

      arr2D[tmp.objectSourceIndex][tmp.objectTargetIndex] = tmp.distance;
    }

    return arr2D;
  }

  transformToDistanceEachOthers(predictionLabels) {
    const distanceArr2D = this.transformToArr2D();

    const distanceEachOthers = [];

    for (let i = 0; i < distanceArr2D.length; i++) {
      const sourceObject = {
        objectSourceIndex: i,
        label: predictionLabels[i].label,
        distanceTo: [],
      };

      for (let j = 0; j < distanceArr2D[i].length; j++) {
        if (i === j) {
          continue;
        }

        const distanceTo = {
          objectDestinationIndex: j,
          label: predictionLabels[j].label,
          distance: distanceArr2D[i][j],
        };

        // insert distance sortest first
        const index = sourceObject.distanceTo.findIndex(
          (distance) => distance.distance > distanceTo.distance
        );
        if (index === -1) {
          sourceObject.distanceTo.push(distanceTo);
        } else {
          sourceObject.distanceTo.splice(index, 0, distanceTo);
        }
      }

      distanceEachOthers.push(sourceObject);
    }

    return distanceEachOthers;
  }
}

export default DistanceObjects;
