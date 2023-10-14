namespace microcode {
    export let robot: RobotDriver;

    function checkRobotDriver() {
        if (!robot)
            throw "Add 'robot start' block"
    }

    /**
     * Turns the robot.
    */
    //% weight=98
    //% group="Motors"
    //% block="robot run with turn $turnRatio at speed $speed \\%"
    //% blockid="microcoderobotmotorturn"
    //% speed.defl=100
    //% speed.min=-100
    //% speed.max=100
    //% speed.shadow=speedPicker
    //% turnRatio.shadow=turnRatioPicker
    //% turnRatio.min=-200
    //% turnRatio.max=200
    export function motorRun(turnRatio: number, speed: number) {
        checkRobotDriver()
        robot.motorRun(turnRatio, speed)
    }

    /**
     * Stops the robot.
    */
    //% weight=50
    //% group="Motors"
    //% block="robot motor stop"
    //% blockid="microcoderobotmotorstop"
    export function motorStop() {
        checkRobotDriver()
        robot.motorStop()
    }

    /**
     * Gets the distance reported by the distance sensor
     */
    //% block="robot obstacle distance"
    //% blockId=microcoderobotobstacledistance
    //% group="Input"
    export function obstacleDistance() {
        checkRobotDriver()
        return robot.currentUltrasonicDistance
    }

    /**
     * Gets the distance reported by the distance sensor
     */
    //% block="robot on obstacle changed"
    //% blockId=microcoderobotobstacledistancechanged
    //% group="Input"
    export function onObstacleChanged(handler: () => void) {
        checkRobotDriver()
        microcode.robots.onEvent(microcode.robots.RobotCompactCommand.ObstacleState, handler)
    }

    /**
     * Checks the state of lines
     */
    //% block="robot detect lines $state"
    //% blockId=microcoderobotdetectlines
    //% group="Input"
    export function detectLines(state: RobotLineState): boolean {
        checkRobotDriver()
        return robot.currentLineState === state
    }

    /**
     * Registers an event to run when the line detection state changes
     */
    //% block="robot on line $state detected"
    //% blockId=microcoderobotondetectlines
    //% group="Input"
    export function onLineDetected(state: RobotLineState, handler: () => void) {
        const msg = microcode.robots.RobotCompactCommand.LineState | state
        microcode.robots.onEvent(msg, handler)
    }

    /**
     * 
     */
    //% block="robot set line assist to $enabled"
    //% blockId="microcoderobotsetlineassist"
    //% group="Configuration"
    //% enabled=toggleOnOff
    export function setLineAssist(enabled: boolean): void {
        checkRobotDriver()
        robot.lineAssist = !!enabled
    }

    /**
    * Sets a value that corrects the ratio of power between the left and the right motor to account for hardware differences.
    */
    //% block="robot set motor drift to %drift"
    //% blockId="microcoderobotsetmotordrift"
    //% group="Configuration"
    //% weight=10
    //% drift.min=-25
    //% drift.max=25
    export function setMotorDrift(drift: number) {
        checkRobotDriver()
        robot.runDrift = Math.clamp(-25, 25, drift)
        led.stopAnimation()
    }

    /**
     * Sets the radio group used to communicate commands.
    */
    //% block="robot set radio group to $group"
    //% blockId="microcoderobotsetradiogroup"
    //% group="Configuration"
    //% weight=9
    //% group.min=1
    //% group.max=32
    export function setRadioGroup(group: number) {
        checkRobotDriver()
        robot.setRadioGroup(group)
        led.stopAnimation()
    }
}