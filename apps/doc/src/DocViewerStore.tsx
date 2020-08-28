import React from 'react';
import {Provider} from "polar-shared/src/util/Providers";
import {
    createObservableStore,
    SetStore
} from "../../../web/js/react/store/ObservableStore";
import {IDocMeta} from "polar-shared/src/metadata/IDocMeta";
import {IDStr, URLStr} from "polar-shared/src/util/Strings";
import {DocMetaFileRefs} from "../../../web/js/datastore/DocMetaRef";
import {Backend} from 'polar-shared/src/datastore/Backend';
import {usePersistenceLayerContext} from "../../repository/js/persistence_layer/PersistenceLayerApp";
import {useAnnotationSidebarCallbacks} from './AnnotationSidebarStore';
import {useDocMetaContext} from "../../../web/js/annotation_sidebar/DocMetaContextProvider";
import {
    AnnotationMutationCallbacks,
    AnnotationMutationsContextProvider,
    IAnnotationMutationCallbacks
} from "../../../web/js/annotation_sidebar/AnnotationMutationsContext";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import {Percentages} from "polar-shared/src/util/Percentages";
import {Pagemarks} from "../../../web/js/metadata/Pagemarks";
import {Preconditions} from "polar-shared/src/Preconditions";
import {IPagemark} from "polar-shared/src/metadata/IPagemark";
import {ScaleLevelTuple} from "./ScaleLevels";
import {PageNavigator} from "./PageNavigator";
import {useLogger} from "../../../web/js/mui/MUILogger";
import {DocViewerSnapshots} from "./DocViewerSnapshots";
import {DocMetas} from '../../../web/js/metadata/DocMetas';
import {Arrays} from 'polar-shared/src/util/Arrays';
import {
    Direction,
    FluidPagemarkFactory,
    NullFluidPagemarkFactory
} from "./FluidPagemarkFactory";
import {IPagemarkRect} from "polar-shared/src/metadata/IPagemarkRect";
import {PagemarkRect} from "../../../web/js/metadata/PagemarkRect";
import {IPagemarkRef} from "polar-shared/src/metadata/IPagemarkRef";
import {PagemarkMode} from "polar-shared/src/metadata/PagemarkMode";

/**
 * Lightweight metadata describing the currently loaded document.
 */
export interface IDocDescriptor {

    readonly nrPages: number;

    readonly fingerprint: IDStr;

}

export interface IDocScale {

    readonly scale: ScaleLevelTuple;

    /**
     * The applied scale value derived from a string like 'page-width' but
     * actually computed as something like 1.2
     */
    readonly scaleValue: number;

}

export type ScaleValue = number;

export type Resizer = () => void;

/**
 * Scale us and then return the new scale as a numbers
 */
export type ScaleLeveler = (scale: ScaleLevelTuple) => ScaleValue;

export interface IDocViewerStore {

    /**
     * The DocMeta currently being managed.
     */
    readonly docMeta?: IDocMeta;

    /**
     * The current page number we're on.
     */
    readonly page: number;

    /**
     * True when the document we're viewing assert that it has loaded.
     */
    readonly docLoaded: boolean;

    readonly docDescriptor?: IDocDescriptor;

    /**
     * The storage URL for the document this docMeta references.
     */
    readonly docURL?: URLStr;

    readonly pageNavigator?: PageNavigator;

    /**
     * Resizer that forces the current doc to fit inside its container properly
     */
    readonly resizer?: Resizer;

    readonly docScale?: IDocScale;

    readonly scaleLeveler?: ScaleLeveler;

    readonly pendingWrites: number

    readonly hasPendingWrites?: boolean;

    readonly fluidPagemarkFactory: FluidPagemarkFactory;

}

export interface IPagemarkCoverage {
    readonly percentage: number;
    readonly rect: PagemarkRect;
    readonly range: Range | undefined;
}

export interface IPagemarkCreateOrUpdate {

    /**
     * The DOM range for the covering pagemark (use for fluid pagemarks).
     */
    readonly range: Range | undefined;

}

export interface IPagemarkCreateToPoint extends IPagemarkCreateOrUpdate {

    readonly type: 'create-to-point';

    // where to create the pagemark
    readonly x: number;
    readonly y: number;

    // the width and height of the current page.
    readonly width: number;
    readonly height: number;

    // the page number of the current page.
    readonly pageNum: number;

}

export interface IPagemarkCreateFromPage extends IPagemarkCreateOrUpdate {

    readonly type: 'create-from-page';

    // where to create the pagemark
    readonly x: number;
    readonly y: number;

    // the width and height of the current page.
    readonly width: number;
    readonly height: number;

    // the page number of the current page.
    readonly pageNum: number;

    readonly fromPage: number;

}

export interface IPagemarkUpdate extends IPagemarkCreateOrUpdate {

    readonly type: 'update',
    readonly pageNum: number;

    /**
     * The existing pagemark to update.
     */
    readonly existing: IPagemark;

    /**
     * The new pagemark's percentage.
     */
    readonly percentage: number;

    /**
     * The new pagemark's covering rect (for PDF)
     */
    readonly rect: IPagemarkRect;

    /**
     * Direction must be specified when updating / resizing pagemarks.
     */
    readonly direction: Direction;

}

export interface IPagemarkUpdateMode {

    readonly type: 'update-mode',

    /**
     * The existing pagemark to update.
     */
    readonly existing: IPagemark;

    /**
     * The new pagemark's percentage.
     */
    readonly mode: PagemarkMode;

}


export interface IPagemarkDelete {
    readonly type: 'delete',
    readonly pageNum: number;
    readonly pagemark: IPagemark;
}

export type IPagemarkMutation = IPagemarkCreateToPoint |
                                IPagemarkCreateFromPage |
                                IPagemarkUpdate |
                                IPagemarkDelete |
                                IPagemarkUpdateMode;

/**
 * The type of update for setDocMeta.
 *
 * update: regular / direct store update
 * snapshot: update from a firestore snapshot
 *
 */
export type SetDocMetaType = 'update' | 'snapshot';

export interface IDocViewerCallbacks {

    /**
     * Update the DocMeta in the store after a local mutation including
     * increment the UUID.
     */
    readonly updateDocMeta: (docMeta: IDocMeta) => IDocMeta;
    readonly setDocMeta: (docMeta: IDocMeta, hasPendingWrites: boolean, type: SetDocMetaType) => void;
    readonly setDocDescriptor: (docDescriptor: IDocDescriptor) => void;
    readonly setDocScale: (docScale: IDocScale) => void;
    readonly setDocLoaded: (docLoaded: false) => void;
    readonly setResizer: (resizer: Resizer) => void;
    readonly setScaleLeveler: (scaleLeveler: ScaleLeveler) => void;
    readonly annotationMutations: IAnnotationMutationCallbacks;
    readonly onPageJump: (page: number) => void;
    readonly setScale: (scaleLevel: ScaleLevelTuple) => void;
    readonly setPage: (page: number) => void;
    readonly setFluidPagemarkFactory: (fluidPagemarkFactory: FluidPagemarkFactory) => void;
    // readonly getAnnotationsFromDocMeta: (refs: ReadonlyArray<IAnnotationRef>) => void;

    onPagemark(opts: IPagemarkMutation): ReadonlyArray<IPagemarkRef>;
    setPageNavigator(pageNavigator: PageNavigator): void;

    onPagePrev(): void;
    onPageNext(): void;

}

const initialStore: IDocViewerStore = {
    page: 1,
    docLoaded: false,
    pendingWrites: 0,
    fluidPagemarkFactory: new NullFluidPagemarkFactory()
}

interface Mutator {

}

function mutatorFactory(storeProvider: Provider<IDocViewerStore>,
                        setStore: SetStore<IDocViewerStore>): Mutator {

    function reduce(): IDocViewerStore | undefined {
        return undefined;
    }

    return {};

}

type IDocMetaProvider = () => IDocMeta | undefined;

function callbacksFactory(storeProvider: Provider<IDocViewerStore>,
                          setStore: (store: IDocViewerStore) => void,
                          mutator: Mutator): IDocViewerCallbacks {

    const log = useLogger();
    const docMetaContext = useDocMetaContext();
    const persistenceLayerContext = usePersistenceLayerContext();
    const annotationSidebarCallbacks = useAnnotationSidebarCallbacks();

    const docMetaProvider = React.useMemo<IDocMetaProvider>(() => {

        return () => {
            const store = storeProvider();
            return store.docMeta;
        }

    }, []);

    async function writeUpdatedDocMetas(updatedDocMetas: ReadonlyArray<IDocMeta>) {

        function mutatePendingWrites(delta: number) {
            const store = storeProvider();

            const pendingWrites = store.pendingWrites + delta;
            const hasPendingWrites = pendingWrites > 0;

            setStore({...store, pendingWrites, hasPendingWrites});
        }

        try {
            mutatePendingWrites(1);
            await annotationMutations.writeUpdatedDocMetas(updatedDocMetas);
        } finally {
            mutatePendingWrites(-1);
        }

    }

    function updateDocMeta(docMeta: IDocMeta): IDocMeta {
        const updated = DocMetas.updated(docMeta);
        setDocMeta(updated, true, 'update');
        return updated;
    }

    function setDocMeta(docMeta: IDocMeta, hasPendingWrites: boolean, type: 'update' | 'snapshot') {

        Preconditions.assertPresent(docMeta, 'docMeta');

        function doExec() {
            const store = storeProvider();

            const computeDocURL = (): URLStr | undefined => {

                // this is only computed once, when we don't have a store...

                if (docMeta) {

                    const docMetaFileRef = DocMetaFileRefs.createFromDocMeta(docMeta);
                    const persistenceLayer = persistenceLayerContext.persistenceLayerProvider();

                    if (docMetaFileRef.docFile) {
                        const file = persistenceLayer.getFile(Backend.STASH, docMetaFileRef.docFile);
                        return file.url;
                    }

                }

                return undefined;

            };

            const docURL = store.docURL || computeDocURL();

            setStore({...store, docMeta, docURL, hasPendingWrites});

        }

        const store = storeProvider();

        type UpdateType = 'fresh' | 'stale';

        function computeUpdateType(): UpdateType {
            return DocViewerSnapshots.isStaleUpdate(store.docMeta?.docInfo?.uuid, docMeta.docInfo.uuid) ? 'stale' : 'fresh';
        }

        const updateType = computeUpdateType();

        console.log(`Update for docMeta was ${updateType} for type=${type} - ${store.docMeta?.docInfo?.uuid} vs ${docMeta.docInfo.uuid}`);

        if (updateType === 'stale') {
            return;
        }

        // update the main store.
        doExec();

        docMetaContext.setDoc({docMeta, mutable: true});

        // update the annotation sidebar
        annotationSidebarCallbacks.setDocMeta(docMeta);

    }

    function setDocDescriptor(docDescriptor: IDocDescriptor) {
        const store = storeProvider();
        setStore({...store, docDescriptor});
    }

    function setDocScale(docScale: IDocScale) {
        const store = storeProvider();
        setStore({...store, docScale});
    }

    function setDocLoaded(docLoaded: boolean) {
        const store = storeProvider();
        setStore({...store, docLoaded});
    }

    function setResizer(resizer: Resizer) {
        const store = storeProvider();
        setStore({...store, resizer});
    }

    function setScaleLeveler(scaleLeveler: ScaleLeveler) {
        const store = storeProvider();
        setStore({...store, scaleLeveler});
    }

    function setScale(scaleLevel: ScaleLevelTuple) {
        const store = storeProvider();

        const {scaleLeveler} = store;

        if (scaleLeveler) {

            const scaleValue = scaleLeveler(scaleLevel);

            const docScale: IDocScale = {
                scale: scaleLevel,
                scaleValue,
            }

            setDocScale(docScale);

        }

    }

    function setFluidPagemarkFactory(fluidPagemarkFactory: FluidPagemarkFactory) {
        const store = storeProvider();
        setStore({...store, fluidPagemarkFactory});
    }

    const annotationMutations = AnnotationMutationCallbacks.create(updateStore, NULL_FUNCTION);

    function updateStore(docMetas: ReadonlyArray<IDocMeta>): ReadonlyArray<IDocMeta> {
        // this is almost always just ONE item at a time so any type of
        // bulk performance updates are pointless
        return docMetas.map(docMeta => updateDocMeta(docMeta));
    }

    function onPagemark(mutation: IPagemarkMutation): ReadonlyArray<IPagemarkRef> {

        function updatePagemarkRange(pagemark: IPagemark,
                                     range: Range | undefined,
                                     direction: Direction | undefined,
                                     existing: IPagemark | undefined) {
            const store = storeProvider();
            const fluidPagemark = store.fluidPagemarkFactory.create({range, direction, existing});
            // now add the range which is needed for fluid pagemarks.
            pagemark.range = fluidPagemark?.range;
        }

        function createPagemarkToPoint(opts: IPagemarkCreateToPoint, start?: number): ReadonlyArray<IPagemarkRef> {

            const store = storeProvider();
            const {docMeta} = store;

            if (!docMeta) {
                return [];
            }

            const {pageNum} = opts;

            const verticalOffsetWithinPageElement = opts.y;
            const pageHeight = opts.height;

            const percentage = Percentages.calculate(verticalOffsetWithinPageElement,
                                                     pageHeight,
                                                     {noRound: true});

            console.log("Created pagemark with percentage: ", percentage);

            function deletePagemarkForCurrentPage(pageNum: number) {
                Preconditions.assertNumber(pageNum, "pageNum");
                Pagemarks.deletePagemark(docMeta!, pageNum);
            }

            function createPagemarksForRange(endPageNum: number, percentage: number) {

                const createdPagemarks = Pagemarks.updatePagemarksForRange(docMeta!, endPageNum, percentage, {start});

                if (createdPagemarks.length > 0) {
                    const last = Arrays.last(createdPagemarks)!
                    const fluidPagemark = store.fluidPagemarkFactory.create({range: opts.range, direction: undefined, existing: undefined});
                    // now add the range which is needed for fluid pagemarks.
                    last.pagemark.range = fluidPagemark?.range;
                    updatePagemarkRange(last.pagemark, opts.range, undefined, undefined);
                }

                return createdPagemarks;

            }

            deletePagemarkForCurrentPage(pageNum);
            const createdPagemarks = createPagemarksForRange(pageNum, percentage);

            writeUpdatedDocMetas([docMeta])
               .catch(err => log.error(err));

            return createdPagemarks;

        }

        function createPagemarkFromPage(opts: IPagemarkCreateFromPage) {

            const createOpts: IPagemarkCreateToPoint = {
                ...opts,
                type: 'create-to-point',
                range: opts.range,
            };

            return createPagemarkToPoint(createOpts, opts.fromPage);

        }

        function updatePagemark(mutation: IPagemarkUpdate) {
            const store = storeProvider();
            const docMeta = store.docMeta!;

            function createPagemark() {
                const newPagemark = Object.assign({}, mutation.existing);
                newPagemark.percentage = mutation.percentage;
                newPagemark.rect = mutation.rect;
                return newPagemark;
            }

            const pagemark = createPagemark();
            updatePagemarkRange(pagemark, mutation.range, mutation.direction, mutation.existing);
            Pagemarks.updatePagemark(docMeta, mutation.pageNum, pagemark);

            updateDocMeta(docMeta);
            writeUpdatedDocMetas([docMeta])
                .catch(err => log.error(err));

            return [{pageNum: mutation.pageNum, pagemark}];
        }

        function deletePagemark(mutation: IPagemarkDelete) {

            const store = storeProvider();
            const docMeta = store.docMeta!;
            const {pageNum, pagemark} = mutation;

            Pagemarks.deletePagemark(docMeta, pageNum, pagemark.id);
            updateDocMeta(docMeta);
            writeUpdatedDocMetas([docMeta])
                .catch(err => log.error(err));
        }

        function updatePagemarkMode(mutation: IPagemarkUpdateMode) {

            const store = storeProvider();
            const docMeta = store.docMeta!;

            mutation.existing.mode = mutation.mode;
            updateDocMeta(docMeta);
            writeUpdatedDocMetas([docMeta])
                .catch(err => log.error(err));

            return [];

        }

        switch (mutation.type) {

            case "create-to-point":
                return createPagemarkToPoint(mutation);
            case "create-from-page":
                return createPagemarkFromPage(mutation);
            case "update":
                return updatePagemark(mutation);
            case "delete":
                deletePagemark(mutation);
                return [];
            case "update-mode":
                return updatePagemarkMode(mutation);

        }

    }

    function setPageNavigator(pageNavigator: PageNavigator) {
        const store = storeProvider();
        setStore({...store, pageNavigator})
    }

    function onPageJump(page: number) {

        async function doAsync() {
            await doPageJump(page);
        }

        doAsync()
          .catch(err => log.error('Could not handle page jump: ', err));

    }

    async function doPageJump(newPage: number) {

        const store = storeProvider();
        const {pageNavigator, page} = store;

        if (! pageNavigator) {
            return;
        }

        if (newPage <= 0) {
            // invalid page as we requested to jump too low
            return;
        }

        if (newPage > pageNavigator.count) {
            // went past the end.
            return;
        }

        if (newPage === pageNavigator.get()) {
            // noop as this is currently done.
            return;
        }

        await pageNavigator.jumpToPage(newPage);
        setStore({
            ...store,
            page: newPage
        });

    }

    function doPageNav(delta: number) {

        async function doAsync() {
            const store = storeProvider();
            const {page} = store;
            const newPage = page + delta;
            await doPageJump(newPage);
        }

        doAsync().catch(err => log.error("Could not handle page nav: ", err));

    }

    function onPageNext() {
        doPageNav(1);
    }

    function onPagePrev() {
        doPageNav(-1);
    }

    function setPage(page: number) {
        const store = storeProvider();
        setStore({
             ...store,
             page
         });
    }

    return {
        updateDocMeta,
        setDocMeta,
        setDocDescriptor,
        setDocScale,
        setDocLoaded,
        setPageNavigator,
        annotationMutations,
        onPagemark,
        onPageJump,
        onPagePrev,
        onPageNext,
        setResizer,
        setScaleLeveler,
        setScale,
        setPage,
        setFluidPagemarkFactory
    };

}

export const [DocViewerStoreProviderDelegate, useDocViewerStore, useDocViewerCallbacks, useDocViewerMutator]
    = createObservableStore<IDocViewerStore, Mutator, IDocViewerCallbacks>({
        initialValue: initialStore,
        mutatorFactory,
        callbacksFactory
    });

interface IProps {
    readonly children: React.ReactElement;
}

const DocViewerStoreInner = React.memo((props: IProps) => {

    const docViewerCallbacks = useDocViewerCallbacks();

    return (
        <AnnotationMutationsContextProvider value={docViewerCallbacks.annotationMutations}>
            {props.children}
        </AnnotationMutationsContextProvider>
    );
});


export const DocViewerStore = React.memo((props: IProps) => {
    return (
        <DocViewerStoreProviderDelegate>
            <DocViewerStoreInner>
                {props.children}
            </DocViewerStoreInner>
        </DocViewerStoreProviderDelegate>
    );
});



