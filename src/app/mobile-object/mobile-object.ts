
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { timer } from 'rxjs/observable/timer';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { share } from 'rxjs/operators';
import { take } from 'rxjs/operators';

export interface Dynamics { deltaSpace: number; cumulatedSpace: number; acc: number; vel: number; }

const VEL_0 = 10;  // if velocity (in pix per second) is lower than this value it is considered 0 when braking

const MAX_POWER = 10;
const MAX_VELOCITY = 1000;

export class MobileOject {

  velocityX = 0;
  velocityY = 0;
  maxVelocity = MAX_VELOCITY;
  spaceTravelledX = 0;
  spaceTravelledY = 0;

  accelerateX = new BehaviorSubject<number>(0);
  accelerateY = new BehaviorSubject<number>(0);

  deltaSpaceObsX: Observable<Dynamics>;
  deltaSpaceObsY: Observable<Dynamics>;

  private leftAccSub: Subscription;
  private rightAccSub: Subscription;
  private upAccSub: Subscription;
  private downAccSub: Subscription;


  // timeFramesMilliseconds is a sequence of time intervals in milliseconds
  // at the end of each timeFrame an instance of 'Dynamics' is emitted by 'deltaSpaceObsX' and'deltaSpaceObsY' observables
  // each event emitted goes with an intance of type 'Dynamics', related to the X and Y axix depending on the Observable
  // the values of the instances of 'Dynamics' are the following
  //    acceleration: is the accelareation at the beginning of each timeFrame
  //    velocity: is the velocity calculated at the end of each timeFrame based on the acceleration given
  //    deltaSpace: is the space covered within each timeFrame
  constructor(timeFramesMilliseconds?: Observable<number>) {
    const tFrames = timeFramesMilliseconds ? timeFramesMilliseconds : this.timeFrames(10);
    this.deltaSpaceObsX = this.accelerateX.pipe(
        switchMap(acc => this.dynamics(acc, this.velocityX, this.spaceTravelledX, tFrames)),
        tap(data => this.velocityX = data.vel),
        tap(data => this.spaceTravelledX = data.cumulatedSpace),
        share()
      );
    this.deltaSpaceObsY = this.accelerateY.pipe(
        switchMap(acc => this.dynamics(acc, this.velocityY, this.spaceTravelledY, tFrames)),
        tap(data => this.velocityY = data.vel),
        tap(data => this.spaceTravelledY = data.cumulatedSpace),
        share()
      );
  }
  private timeFrames(frameApproximateLenght: number, numberOfFrames?: number) {
    const clock = timer(0, frameApproximateLenght);
    if (numberOfFrames) {
        clock.pipe(take(numberOfFrames));
    }
    let t0 = Date.now();
    let t1: number;
    const obsTime = clock.pipe(
        tap(() => t1 = Date.now()),
        map(() => t1 - t0),
        tap(() => t0 = t1)
    );
    return obsTime;
  }

  private deltaSpaceFromVelocity(velocity: number, deltaTime: number) {
      return velocity * deltaTime;
  }
  private deltaVelocityFromAcceleration(acceleration: number, deltaTime: number) {
      return acceleration * deltaTime;
  }
  private deltaSpaceAndVelocityFromAcceleration(acceleration: number, initialVelocity: number, deltaTime: number) {
      const deltaVelocity = this.deltaVelocityFromAcceleration(acceleration, deltaTime);
      const averageVelocity = initialVelocity + (deltaVelocity / 2);
      const deltaSpace = averageVelocity * deltaTime;
      return {deltaVelocity, deltaSpace};
  }

  private dynamics(acc: number, initialVelocity: number, spaceTravelled: number, timeFramesMilliseconds: Observable<number>) {
    let vel = initialVelocity;
    let cumulatedSpace = spaceTravelled;
    return timeFramesMilliseconds.pipe(
        map(deltaTime => {
            const seconds = deltaTime / 1000;
            const deltaVelSpace = this.deltaSpaceAndVelocityFromAcceleration(acc, vel, seconds);
            const deltaSpace = deltaVelSpace.deltaSpace;
            cumulatedSpace = cumulatedSpace + deltaSpace;
            vel = vel + deltaVelSpace.deltaVelocity;
            const direction = vel / Math.abs(vel);
            vel = Math.abs(vel) > this.maxVelocity ? this.maxVelocity * direction : vel;
            if (acc === 0 && Math.abs(vel) < VEL_0) {
              vel = 0;
            }
            return {deltaSpace, cumulatedSpace, acc, vel};
        })
    );
  }


//   accelerateHorizontal(acceleration: number, forward = true) {
//     const directionSign = forward ? 1 : -1;
//     return interval(50).pipe(
//       take(100),
//       tap(acceleration => this.accelerateX.next(acceleration * directionSign))
//     ).subscribe();
//   }

//   powerHorizontal(percentageOfMaxPower: number, forward = true) {
//     const directionSign = forward ? 1 : -1;
//     return interval(50).pipe(
//     //   take(100),
//       tap(acceleration => this.accelerateX.next(acceleration * directionSign))
//     ).subscribe();
//   }

//   pedalUp() {
//     this.accelerateX.next(0);
//     this.accelerateY.next(0);
//   }

}
