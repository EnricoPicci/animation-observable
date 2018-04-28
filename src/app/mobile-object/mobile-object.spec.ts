
// import 'mocha';
import { expect } from 'chai';

import { Observable } from 'rxjs/Observable';
import { timer } from 'rxjs/observable/timer';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { scan } from 'rxjs/operators';

import {MobileOject} from './mobile-object';


describe('accelerate', () => {

    it('accelerates a mobile object on the X axis and measure after 1 second the speed reached and the space covered', done => {
        const acceleration = 20;
        const tf = timeFrames(10, 200);
        let speed = 0;
        let spaceTravelled = 0;
        const mobileObject = new MobileOject(tf);
        mobileObject.accelerateX.next(acceleration);
        mobileObject.deltaSpaceObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed > 21 || speed < 19) {
                console.error('speed not as expected', speed);
                done('speed not as expected');
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 10.5 || spaceTravelled < 9.5) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done('spaceTravelled not as expected');
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 1000);
    });

    it('accelerates a mobile object on the Y axis and measure after 2 seconds the speed reached and the space covered', done => {
        const acceleration = 30;
        const tf = timeFrames(10, 300);
        let speed = 0;
        let spaceTravelled = 0;
        const mobileObject = new MobileOject(tf);
        mobileObject.accelerateY.next(acceleration);
        mobileObject.deltaSpaceObsY
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed > 61 || speed < 59) {
                console.error('speed not as expected', speed);
                done('speed not as expected');
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 61 || spaceTravelled < 59) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done('spaceTravelled not as expected');
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 2000);
    });

    it('accelerates NEGATIVE a mobile object on the Y axis and measure after 2 seconds the speed reached and the space covered', done => {
        const acceleration = -40;
        const tf = timeFrames(10, 300);
        let speed = 0;
        let spaceTravelled = 0;
        const mobileObject = new MobileOject(tf);
        mobileObject.accelerateY.next(acceleration);
        mobileObject.deltaSpaceObsY
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed < -121 || speed > -119) {
                console.error('speed not as expected', speed);
                done('speed not as expected');
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled < -181 || spaceTravelled > -179) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done('spaceTravelled not as expected');
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 3000);
    });

});

describe('the object has an initial velocity but no acceleration', () => {

    it('set an initial velocity but no acceleration - measure after 2 seconds the space covered', done => {
        // const tf = timeFrames(10, 200);
        let speed = 0;
        let spaceTravelled = 0;
        const mobileObject = new MobileOject();
        const initialSpeed = 20;
        mobileObject.velocityX = initialSpeed;
        // accelerate to start the movement even if acceleration is 0
        setTimeout(() => mobileObject.accelerateX.next(0), 0);
        mobileObject.deltaSpaceObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed !== initialSpeed) {
                console.error('speed not as expected', speed);
                done('speed not as expected');
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 42 || spaceTravelled < 38) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done('spaceTravelled not as expected');
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 2000);
    });

});

describe('accelerate and then decelerate', () => {

    it('accelerates a mobile object on the X axis and stops accelerating after 1 sec - measure after 2 seconds speed and space', done => {
        let speed = 0;
        let spaceTravelled = 0;
        let acc = 0;
        const mobileObject = new MobileOject();
        // first accelerate +20
        setTimeout(() => mobileObject.accelerateX.next(20), 0);
        // after 1 second no acceleration
        setTimeout(() => mobileObject.accelerateX.next(0), 1000);
        mobileObject.deltaSpaceObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
                acc = data.acc;
            }
        );
        setTimeout(() => {
            if (acc !== 0) {
                console.error('acceleration not as expected', acc);
                done('acceleration not as expected');
                throw(new Error('acceleration not as expected'));
            }
            if (speed > 22 || speed < 18) {
                console.error('speed not as expected', speed);
                done('speed not as expected');
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 31 || spaceTravelled < 29) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done('spaceTravelled not as expected');
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 2000);
    });

    it('accelerates on the Y axis and decelerate after 1 sec - measure after 3 seconds speed and space', done => {
        let speed = 0;
        let spaceTravelled = 0;
        let acc = 0;
        const mobileObject = new MobileOject();
        // first accelerate +20
        setTimeout(() => mobileObject.accelerateX.next(20), 0);
        // after 1 second decelerate -10
        setTimeout(() => mobileObject.accelerateX.next(-10), 1000);
        mobileObject.deltaSpaceObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
                acc = data.acc;
            }
        );
        setTimeout(() => {
            if (acc !== -10) {
                console.error('acceleration not as expected', acc);
                done('acceleration not as expected');
                throw(new Error('acceleration not as expected'));
            }
            if (speed > 1 || speed < -1) {
                console.error('speed not as expected', speed);
                done('speed not as expected');
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 31 || spaceTravelled < 29) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done('spaceTravelled not as expected');
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 3000);
    });

});

function timeFrames(interval: number, numberOfFrames: number) {
    const clock = timer(0, interval).pipe(take(numberOfFrames));

    let t0 = Date.now();
    let t1: number;
    // const timeIntervals = new Array<number>();
    const obsTime = clock.pipe(
        tap(() => t1 = Date.now()),
        map(() => t1 - t0),
        // tap(d => timeIntervals.push(d)),
        tap(() => t0 = t1)
    );

    return obsTime;
}
