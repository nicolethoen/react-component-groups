import type { FunctionComponent } from 'react';
import { useState, useEffect } from 'react';
import {
  Button,
  Content,
  ContentVariants,
  ButtonVariant,
} from '@patternfly/react-core';
import { ModalProps, Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import ListManager, { ListManagerItem } from '../ListManager/ListManager';

export interface ColumnManagementModalColumn {
  /** Internal identifier of a column by which table displayed columns are filtered. */
  key: string;
  /** The actual display name of the column possibly with a tooltip or icon. */
  title: React.ReactNode;
  /** If user changes checkboxes, the component will send back column array with this property altered. */
  isShown?: boolean;
  /** Set to false if the column should be hidden initially */
  isShownByDefault: boolean;
  /** The checkbox will be disabled, this is applicable to columns which should not be toggleable by user */
  isUntoggleable?: boolean;
}

/** extends ModalProps */
export interface ColumnManagementModalProps extends Omit<ModalProps, 'ref' | 'children'> {
  /** Flag to show the modal */
  isOpen?: boolean;
  /** Invoked when modal visibility is changed */
  onClose?: (event: KeyboardEvent | React.MouseEvent) => void;
  /** Current column state */
  appliedColumns: ColumnManagementModalColumn[];
  /** Invoked with new column state after save button is clicked */
  applyColumns: (newColumns: ColumnManagementModalColumn[]) => void;
  /* Modal description text */
  description?: string;
  /* Modal title text */
  title?: string;
  /** Custom OUIA ID */
  ouiaId?: string | number;
  /** Enable drag and drop functionality for reordering columns */
  enableDragDrop?: boolean;
}

const ColumnManagementModal: FunctionComponent<ColumnManagementModalProps> = (
  { title = 'Manage columns',
    description = 'Selected categories will be displayed in the table.',
    isOpen = false,
    onClose = () => undefined,
    appliedColumns,
    applyColumns,
    ouiaId = 'ColumnManagementModal',
    enableDragDrop = false,
    ...props }: ColumnManagementModalProps) => {

  const [ currentColumns, setCurrentColumns ] = useState(() =>
    appliedColumns.map(column => ({ ...column, isShown: column.isShown ?? column.isShownByDefault }))
  );

  // Sync with appliedColumns when they change
  useEffect(() => {
    setCurrentColumns(appliedColumns.map(column => ({ ...column, isShown: column.isShown ?? column.isShownByDefault })));
  }, [ appliedColumns ]);

  // Convert ColumnManagementModalColumn to ListManagerItem
  const listManagerItems: ListManagerItem[] = currentColumns.map(column => ({
    key: column.key,
    title: column.title,
    isSelected: column.isShown,
    isShownByDefault: column.isShownByDefault,
    isUntoggleable: column.isUntoggleable
  }));

  const resetToDefault = () => {
    setCurrentColumns(currentColumns.map(column => ({ ...column, isShown: column.isShownByDefault ?? false })));
  };

  const updateColumns = (items: ListManagerItem[]) => {
    const newColumns = currentColumns.map(column => {
      const matchingItem = items.find(item => item.key === column.key);
      return matchingItem
        ? { ...column, isShown: matchingItem.isSelected ?? column.isShownByDefault }
        : column;
    });
    setCurrentColumns(newColumns);
  };

  const handleSelect = (item: ListManagerItem) => {
    updateColumns([ item ]);
  };

  const handleSelectAll = (items: ListManagerItem[]) => {
    updateColumns(items);
  };

  const handleOrderChange = (items: ListManagerItem[]) => {
    // Update the order of currentColumns based on the new order from ListManager
    const newColumns = items.map(item => {
      const originalColumn = currentColumns.find(col => col.key === item.key);
      if (!originalColumn) {
        throw new Error(`Column with key ${item.key} not found`);
      }
      return { ...originalColumn, isShown: item.isSelected ?? originalColumn.isShownByDefault };
    });
    setCurrentColumns(newColumns);
  };

  const handleSave = (items: ListManagerItem[]) => {
    const updatedColumns = items.map(item => ({
      key: item.key,
      title: item.title,
      isShown: item.isSelected,
      isShownByDefault: item.isShownByDefault,
      isUntoggleable: item.isUntoggleable
    }));
    applyColumns(updatedColumns);
    onClose({} as KeyboardEvent);
  };

  const handleCancel = () => {
    onClose({} as KeyboardEvent);
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      isOpen={isOpen}
      variant={ModalVariant.small}
      description={
        <>
          <Content component={ContentVariants.p}>{description}</Content>
          <Button isInline onClick={resetToDefault} variant={ButtonVariant.link} ouiaId={`${ouiaId}-reset-button`}>
            Reset to default
          </Button>
        </>
      }
      ouiaId={ouiaId}
      {...props}
    >
      <ListManager
        columns={listManagerItems}
        ouiaId={ouiaId}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onOrderChange={handleOrderChange}
        onSave={handleSave}
        onCancel={handleCancel}
        enableDragDrop={enableDragDrop}
      />
    </Modal>
  );
}

export default ColumnManagementModal;
