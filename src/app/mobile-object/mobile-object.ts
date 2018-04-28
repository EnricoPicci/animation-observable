
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { timer } from 'rxjs/observable/timer';
import { interval } from 'rxjs/observable/interval';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { share } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { filter } from 'rxjs/operators';

export interface Dynamics { deltaSpace: number; cumulatedSpace: number; acc: number; vel: number; }

const VEL_0 = 10;  // if velocity (e.g. in pix per second) is lower than this value it is considered 0 when braking

const MAX_VELOCITY = 1000;

const BRAKE_DECELERATION = 100;

export class MobileOject {

  velocityX = 0;
  velocityY = 0;
  maxVelocity = MAX_VELOCITY;
  spaceTravelledX = 0;
  spaceTravelledY = 0;

  deltaSpaceObsX: Observable<Dynamics>;
  deltaSpaceObsY: Observable<Dynamics>;

  brakeDeceleration = BRAKE_DECELERATION;

  private accelerateSubjectX = new BehaviorSubject<number>(0);
  private accelerateSubjectY = new BehaviorSubject<number>(0);

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
    this.deltaSpaceObsX = this.accelerateSubjectX.pipe(
        switchMap(acc => this.dynamics(acc, this.velocityX, this.spaceTravelledX, tFrames)),
        tap(data => this.velocityX = data.vel),
        tap(data => this.spaceTravelledX = data.cumulatedSpace),
        share()
      );
    this.deltaSpaceObsY = this.accelerateSubjectY.pipe(
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
        tap(() => t0 = t1),
        share()  // THIS IS ABSOLUTELY CRUCIAL TO MAKE SURE WE BRAKE CORRECTLY
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

  accelerateX(acc: number) {
    this.accelerateSubjectX.next(acc);
  }
  accelerateY(acc: number) {
    this.accelerateSubjectY.next(acc);
  }

  brake() {
    const directionX = this.velocityX > 0 ? -1 : 1;
    const directionY = this.velocityY > 0 ? -1 : 1;
    this.brakeAlongDirection(this.accelerateSubjectX, this.deltaSpaceObsX, directionX);
    this.brakeAlongDirection(this.accelerateSubjectY, this.deltaSpaceObsY, directionY);
  }
  private brakeAlongDirection(accObs: BehaviorSubject<number>, deltaSpaceObs: Observable<Dynamics>, direction: number) {
    accObs.next(direction * this.brakeDeceleration);
    deltaSpaceObs.pipe(
        map(data => data.vel),
        filter(vel => Math.abs(vel) < VEL_0),
        tap(() => {
          accObs.next(0);
          console.log('velX', this.velocityX);
          console.log('velY', this.velocityY);
          this.velocityX = 0;
          this.velocityY = 0;
        }),
        take(1), // to complete the observable
    ).subscribe();
  }
//   private brakeAlongDirection(accObs: BehaviorSubject<number>, deltaSpaceObs: Observable<Dynamics>, direction: number) {
//     let continueDeceleration = true;
//     const brakeSub = interval(100).pipe(
//     //   take(10),
//       filter(() => continueDeceleration),
//     //   tap(decelerationFactor => accObs.next(decelerationFactor * direction * BRAKE_DECELERATION)),
//       tap(() => accObs.next(direction * BRAKE_DECELERATION)),
//       switchMap(() => deltaSpaceObs.pipe(
//         map(data => data.vel),
//         filter(vel => Math.abs(vel) < VEL_0),
//         tap(() => {
//           continueDeceleration = false;
//           accObs.next(0);
//           console.log('velX', this.velocityX);
//           console.log('velY', this.velocityY);
//           this.velocityX = 0;
//           this.velocityY = 0;
//         }),
//         // take(1), // to complete the observable
//       ))
//     ).subscribe();
//   }


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
