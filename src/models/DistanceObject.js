class DistanceObject {
  constructor({
    id,
    predictionId,
    objectSourceIndex,
    objectTargetIndex,
    distance,
  } = {}) {
    this.id = id;
    this.predictionId = predictionId;
    this.objectSourceIndex = objectSourceIndex;
    this.objectTargetIndex = objectTargetIndex;
    this.distance = distance;
  }
}

export default DistanceObject;
