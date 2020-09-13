import * as React from "react";
import {Callback, NULL_FUNCTION} from "polar-shared/src/util/Functions";
import {deepMemo} from "../../react/ReactUtils";
import {Providers} from "polar-shared/src/util/Providers";

export function isInputCompleteEvent(event: React.KeyboardEvent) {
    return event.key === 'Enter';
}

interface InputCompleteListenerOpts {

    readonly onComplete: () => void;

    readonly onCancel?: Callback;

    /**
     * Provide a function which returns true if input is completable.
     */
    readonly completable?: () => boolean;

}

interface InputCompleteListeners {
    readonly onKeyPress: (event: React.KeyboardEvent) => void;
    readonly onKeyUp: (event: React.KeyboardEvent) => void;
    readonly onKeyDown: (event: React.KeyboardEvent) => void;
}

export function useInputCompleteListener(opts: InputCompleteListenerOpts): InputCompleteListeners {

    const completable = opts.completable || Providers.of(true);

    const onKeyDown = React.useCallback((event: React.KeyboardEvent) => {

        if (! completable()) {
            return;
        }

        // note that react-hotkeys is broken when you listen to 'Enter' on
        // ObserveKeys when using an <input> but it doesn't matter because we
        // can just listen to the key directly

        if (isInputCompleteEvent(event)) {
            opts.onComplete();
            return;
        }

        if (event.key === 'Escape' && opts.onCancel) {
            opts.onCancel();
            return;
        }

    }, []);

    return {
        onKeyDown,
        onKeyPress: NULL_FUNCTION,
        onKeyUp: NULL_FUNCTION
    };

}

interface IProps extends InputCompleteListenerOpts {

    readonly children: JSX.Element;

}

export const InputCompleteListener = deepMemo((props: IProps) => {

    const handlers = useInputCompleteListener(props);

    return (
        <div {...handlers} className="input-complete-listener">
            {props.children}
        </div>
    );

});
