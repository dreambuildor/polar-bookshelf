import {DocViewerToolbar} from "./toolbar/DocViewerToolbar";
import * as React from "react";
import {DocViewerAppURLs} from "./DocViewerAppURLs";
import {LoadingProgress} from "../../../web/js/ui/LoadingProgress";
import {TextHighlightsView} from "./annotations/TextHighlightsView";
import {AnnotationSidebar2} from "../../../web/js/annotation_sidebar/AnnotationSidebar2";
import {PagemarkProgressBar} from "./PagemarkProgressBar";
import {AreaHighlightsView} from "./annotations/AreaHighlightsView";
import {PagemarksView} from "./annotations/PagemarksView";
import {useComponentDidMount} from "../../../web/js/hooks/ReactLifecycleHooks";
import {useDocViewerCallbacks, useDocViewerStore} from "./DocViewerStore";
import isEqual from "react-fast-compare";
import {usePersistenceLayerContext} from "../../repository/js/persistence_layer/PersistenceLayerApp";
import {DocFindBar} from "./DocFindBar";
import {DocViewerGlobalHotKeys} from "./DocViewerGlobalHotKeys";
import {
    computeDocViewerContextMenuOrigin,
    DocViewerMenu,
    IDocViewerContextMenuOrigin
} from "./DocViewerMenu";
import {createContextMenu} from "../../repository/js/doc_repo/MUIContextMenu";
import {Helmet} from "react-helmet";
import {DeviceRouter} from "../../../web/js/ui/DeviceRouter";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import {DocFindButton} from "./DocFindButton";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from '@material-ui/icons/Menu';
import {MUIPaperToolbar} from "../../../web/js/mui/MUIPaperToolbar";
import {DocRenderer, DocViewerContext} from "./renderers/DocRenderer";
import {useLogger} from "../../../web/js/mui/MUILogger";
import {ViewerContainerProvider} from "./ViewerContainerStore";
import {FileTypes} from "../../../web/js/apps/main/file_loaders/FileTypes";
import {deepMemo} from "../../../web/js/react/ReactUtils";
import {useStateRef, useRefValue} from "../../../web/js/hooks/ReactHooks";
import {NoDocument} from "./NoDocument";
import {DockLayout2} from "../../../web/js/ui/doc_layout/DockLayout2";
import {Outliner} from "./outline/Outliner";
import {FeedbackButton2} from "../../repository/js/ui/FeedbackButton2";

const Main = React.memo(function Main() {

    return (

        <div className="DocViewer.Main"
             style={{
                 flexGrow: 1,
                 minHeight: 0,
                 display: 'flex',
                 flexDirection: 'column'
             }}>

            <PagemarkProgressBar/>
            <DocViewerGlobalHotKeys/>
            <DocFindBar/>

            <div className="DocViewer.Main.Body"
                 style={{
                     minHeight: 0,
                     overflow: 'auto',
                     flexGrow: 1,
                     position: 'relative'
                 }}>

                <DocViewerContextMenu>
                    <DocMain/>
                </DocViewerContextMenu>
            </div>

        </div>
    )
})

const DocMain = React.memo(() => {

    const {docURL, docMeta} = useDocViewerStore(['docURL', 'docMeta']);

    if (! docURL) {
        return null;
    }

    return (
        <>
            <Helmet>
                <title>{docMeta?.docInfo.title || ''}</title>
            </Helmet>

            <DocRenderer>
                <>
                    <TextHighlightsView />

                    <AreaHighlightsView/>

                    <PagemarksView/>
                </>
            </DocRenderer>

        </>
    )
}, isEqual);

const DocViewerContextMenu = createContextMenu<IDocViewerContextMenuOrigin>(DocViewerMenu, {computeOrigin: computeDocViewerContextMenuOrigin});

namespace Device {

    interface HandheldToolbarProps {
        readonly toggleRightDrawer: () => void;
    }

    const HandheldToolbar = React.memo((props: HandheldToolbarProps) => {

        return (
            <MUIPaperToolbar borderBottom>
            <div style={{
                     display: 'flex',
                     alignItems: 'center'
                 }}
                 className="p-1">

                <div style={{
                         display: 'flex',
                         flexGrow: 1,
                         flexBasis: 0,
                         alignItems: 'center'
                     }}
                     className="">

                    <DocFindButton className="mr-1"/>
                </div>

                <div style={{alignItems: 'center'}}>
                    <IconButton onClick={props.toggleRightDrawer}>
                        <MenuIcon/>
                    </IconButton>
                </div>

            </div>
            </MUIPaperToolbar>
        )
    });

    export const Handheld = React.memo(() => {

        const [open, setOpen] = React.useState(false);

        return (
            <>

                {/*<SwipeableDrawer*/}
                {/*    anchor='left'*/}
                {/*    open={open}*/}
                {/*    onClose={() => setOpen(false)}*/}
                {/*    onOpen={() => setOpen(true)}>*/}

                {/*    <Outliner />*/}

                {/*</SwipeableDrawer>*/}

                <SwipeableDrawer
                    anchor='right'
                    open={open}
                    onClose={() => setOpen(false)}
                    onOpen={() => setOpen(true)}>

                    <AnnotationSidebar2 />

                </SwipeableDrawer>

                <div className="DocViewer.Handheld"
                     style={{
                         display: 'flex',
                         flexDirection: 'column',
                         flexGrow: 1,
                         minHeight: 0
                     }}>

                    <HandheldToolbar toggleRightDrawer={() => setOpen(!open)}/>

                    {/* <DocToolbar/> */}

                    <Main/>

                </div>
            </>
        );
    }, isEqual);

    export const Desktop = React.memo(function Desktop() {

        const {resizer, docMeta} = useDocViewerStore(['resizer', 'docMeta']);

        const resizerRef = useRefValue(resizer);

        const onDockLayoutResize = React.useCallback(() => {

            if (resizerRef.current) {
                resizerRef.current();
            } else {
                console.warn("No resizer");
            }

        }, [resizerRef]);

        return (

            <DockLayout2.Root
                onResize={onDockLayoutResize}
                dockPanels={[
                    {
                        id: "doc-panel-outline",
                        type: 'fixed',
                        side: 'left',
                        collapsed: true,
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                            flexGrow: 1
                        },
                        component: (
                            <Outliner/>
                        ),
                        width: 410,
                    },
                    {
                        id: "dock-panel-viewer",
                        type: 'grow',
                        style: {
                            display: 'flex'
                        },
                        component: <Main/>
                    },
                    {
                        id: "doc-panel-sidebar",
                        type: 'fixed',
                        side: 'right',
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                            flexGrow: 1
                        },
                        component:
                            <>
                                {docMeta &&
                                <AnnotationSidebar2 />}
                            </>,
                        width: 410,
                    }
                ]}>
                <>
                    <div className="DocViewer.Desktop"
                         style={{
                             display: 'flex',
                             flexDirection: 'column',
                             flexGrow: 1,
                             minHeight: 0
                         }}>

                        <DocViewerToolbar/>
                        <FeedbackButton2/>

                        <div className="DocViewer.Desktop.Body"
                             style={{
                                 display: 'flex',
                                 flexDirection: 'column',
                                 flexGrow: 1,
                                 minHeight: 0
                             }}>

                            <DockLayout2.Main/>
                        </div>

                    </div>
                </>
            </DockLayout2.Root>

        );
    });

}

const DocViewerMain = deepMemo(function DocViewerMain() {

    return (
        <DeviceRouter handheld={<Device.Handheld/>}
                      desktop={<Device.Desktop/>}/>
    );

});

interface DocViewerParentProps {
    readonly docID: string;
    readonly children: React.ReactNode;
}

const DocViewerParent = deepMemo((props: DocViewerParentProps) => (
    <div data-doc-viewer-id={props.docID}
         style={{
             display: 'flex',
             minHeight: 0,
             overflow: 'auto',
             flexGrow: 1,
         }}>
        {props.children}
    </div>
));

export const DocViewer = deepMemo(function DocViewer() {

    const {docURL} = useDocViewerStore(['docURL']);
    const {setDocMeta} = useDocViewerCallbacks();
    const log = useLogger();
    const persistenceLayerContext = usePersistenceLayerContext();
    const parsedURL = React.useMemo(() => DocViewerAppURLs.parse(document.location.href), []);
    const [exists, setExists, existsRef] = useStateRef<boolean | undefined>(undefined);

    useComponentDidMount(() => {

        const handleLoad = async () => {

            if (! parsedURL) {
                console.warn("Could not parse URL: " + document.location.href)
                return;
            }

            // TODO useSnapshotSubscriber for this so that we don't have to worry
            // about component unmount.

            const persistenceLayer
                = persistenceLayerContext.persistenceLayerProvider();

            const snapshotResult = await persistenceLayer.getDocMetaSnapshot({
                fingerprint: parsedURL.id,
                onSnapshot: (snapshot => {

                    function computeType() {
                        return snapshot.hasPendingWrites ? 'snapshot-local' : 'snapshot-server';
                    }

                    if (existsRef.current !== snapshot.exists) {
                        setExists(snapshot.exists)
                    }

                    const type = computeType();

                    setDocMeta(snapshot.data!, snapshot.hasPendingWrites, type);

                }),
                onError: (err) => {
                    log.error("Could not handle snapshot: ", err);
                }

            });

        };

        handleLoad()
            .catch(err => log.error(err));

    });

    if (exists === false) {
        return <NoDocument/>;
    }

    if (parsedURL === undefined) {
        return <NoDocument/>;
    }

    const docID = parsedURL.id;

    if (docURL === undefined) {
        return (
            <>
                <LoadingProgress/>
            </>
        )
    }

    const fileType = FileTypes.create(docURL);

    return (
        <DocViewerParent docID={docID}>
            <DocViewerContext.Provider value={{fileType, docID}}>
                <ViewerContainerProvider>
                    <DocViewerMain/>
                </ViewerContainerProvider>
            </DocViewerContext.Provider>
        </DocViewerParent>
    );

});



