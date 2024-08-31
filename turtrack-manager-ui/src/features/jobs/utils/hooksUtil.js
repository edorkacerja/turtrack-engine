import { useRef, useEffect } from 'react';

export function useTraceUpdate(props) {
    const prev = useRef(props);
    useEffect(() => {
        const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
            if (prev.current[k] !== v) {
                if (k === 'jobs') {
                    ps[k] = [`${prev.current[k].length} jobs`, `${v.length} jobs`];
                } else {
                    ps[k] = [prev.current[k], v];
                }
            }
            return ps;
        }, {});
        if (Object.keys(changedProps).length > 0) {
            console.log('JobList changed props:', changedProps);
        }
        prev.current = props;
    });
}

export function useTraceRender(componentName) {
    console.log(`${componentName} rendering`);
}

// export function withTraceUpdate(WrappedComponent) {
//     return class extends React.Component {
//         componentDidUpdate(prevProps, prevState) {
//             Object.entries(this.props).forEach(([key, val]) =>
//                 prevProps[key] !== val && console.log(`Prop '${key}' changed`)
//             );
//             if (this.state) {
//                 Object.entries(this.state).forEach(([key, val]) =>
//                     prevState[key] !== val && console.log(`State '${key}' changed`)
//                 );
//             }
//         }
//
//         render() {
//             return <WrappedComponent {...this.props} />;
//         }
//     };
// }